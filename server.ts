import express from 'express';
import path from 'path';
import { MongoClient, Db } from 'mongodb';

// CRITICAL: Global catchers to stop Vercel from crashing blindly with a 500 error
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION ERROR DETECTED:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION AT PROMISE:', promise, 'REASON:', reason);
});

const app = express();
app.use(express.json());
// ... Leave the rest of your server.ts exactly as it is

// MongoDB connection setup with cached connection promise
interface MongoCache {
  conn: Db | null;
  promise: Promise<Db | null> | null;
  lastError: string | null;
}

let cached: MongoCache = (global as any).mongoCache;
if (!cached) {
  cached = (global as any).mongoCache = { conn: null, promise: null, lastError: null };
}

async function getDb(forceRetry = false): Promise<Db | null> {
  const mongodbUri = process.env.MONGODB_URI || '';
  if (!mongodbUri.trim()) {
    console.warn('[MongoDB] MONGODB_URI environment string is completely missing!');
    return null;
  }

  if (forceRetry) {
    cached.conn = null;
    cached.promise = null;
    cached.lastError = null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    };
    cached.promise = (async () => {
      try {
        console.log('[MongoDB] Triggering handshake to Atlas cluster...');
        const client = new MongoClient(mongodbUri, opts);
        await client.connect();
        const db = client.db(); 
        console.log('[MongoDB] Cloud connection completely established!');
        cached.conn = db;
        cached.lastError = null;
        return db;
      } catch (err: any) {
        cached.promise = null;
        cached.lastError = err?.message || String(err);
        console.error('[MongoDB] Critical connection failure details:', cached.lastError);
        return null; // Return null safely instead of throwing unhandled exceptions
      }
    })();
  }
  return await cached.promise;
}

const memoryStore = {
  users: [] as any[],
  workouts: [] as any[],
  routines: [] as any[],
  feed: [] as any[],
};

// API Routes
app.get('/api/health', async (req, res) => {
  const forceRetry = req.query.retry === 'true';
  const isMongoDBConfigured = Boolean((process.env.MONGODB_URI || '').trim());
  let db: Db | null = null;
  let connectionError: string | null = null;
  
  try {
    db = await getDb(forceRetry);
  } catch (err: any) {
    connectionError = err?.message || String(err);
  }

  res.json({
    status: db ? 'ok' : 'active',
    service: 'IronCrew Strength API',
    database: db ? 'MongoDB Atlas (Connected)' : 'Local Fallback Storage (URI missing or offline)',
    mongodbUriConfigured: isMongoDBConfigured,
    connectionError: connectionError || cached.lastError || null,
    vercelReady: true,
    timestamp: new Date().toISOString(),
  });
});

// Auth handlers
app.get('/api/users', async (req, res) => {
  try {
    const db = await getDb();
    if (db) {
      const users = await db.collection('accounts').find({}).toArray();
      const safeUsers = users.map(({ password, _id, ...rest }) => rest);
      return res.json(safeUsers);
    }
  } catch (e: any) {
    console.error('Fetch users error:', e?.message);
  }
  const safeMemUsers = memoryStore.users.map(({ password, ...rest }) => rest);
  res.json(safeMemUsers);
});

app.put('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  const updatedData = req.body;
  if (!userId || !updatedData) {
    return res.status(400).json({ error: 'Invalid update payload' });
  }
  try {
    const db = await getDb();
    if (db) {
      await db.collection('accounts').updateOne(
        { id: userId },
        { $set: updatedData },
        { upsert: true }
      );
      return res.json({ success: true, storedIn: 'MongoDB' });
    }
  } catch (e: any) {
    console.error('Update user error:', e?.message);
  }
  const idx = memoryStore.users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    memoryStore.users[idx] = { ...memoryStore.users[idx], ...updatedData };
  } else {
    memoryStore.users.push(updatedData);
  }
  res.json({ success: true, storedIn: 'Memory' });
});

app.post('/api/auth/register', async (req, res) => {
  const user = req.body;
  if (!user || !user.id || !user.username) {
    return res.status(400).json({ error: 'Invalid user payload' });
  }
  try {
    const db = await getDb();
    if (db) {
      await db.collection('accounts').updateOne(
        { id: user.id },
        { $set: user },
        { upsert: true }
      );
      return res.json({ success: true, user, storedIn: 'MongoDB' });
    }
  } catch (e: any) {
    console.error('MongoDB register failure, falling back to memory:', e?.message);
  }
  
  // Safe Fallback
  const idx = memoryStore.users.findIndex(u => u.id === user.id);
  if (idx >= 0) memoryStore.users[idx] = user;
  else memoryStore.users.push(user);
  res.json({ success: true, user, storedIn: 'Memory' });
});

app.post('/api/auth/login', async (req, res) => {
  const { query, password } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing username or email' });
  const q = query.trim().toLowerCase();

  try {
    const db = await getDb();
    if (db) {
      const foundUser = await db.collection('accounts').findOne({
        $or: [{ username: q }, { email: q }]
      });
      if (foundUser) {
        if (foundUser.password && password && foundUser.password !== password) {
          return res.status(401).json({ error: 'Incorrect password.' });
        }
        return res.json({ success: true, user: foundUser });
      }
    }
  } catch (e: any) {
    console.error('MongoDB login error, parsing locally:', e?.message);
  }

  const foundLocal = memoryStore.users.find(u => u.username === q || u.email === q);
  if (!foundLocal) return res.status(404).json({ error: 'User not found.' });
  res.json({ success: true, user: foundLocal });
});

// Workouts Data sync handlers
app.get('/api/workouts', async (req, res) => {
  const userId = req.query.userId as string;
  try {
    const db = await getDb();
    if (db) {
      const query: any = { dataType: 'workout' };
      if (userId) query.userId = userId;
      const workouts = await db.collection('data').find(query).sort({ startTime: -1 }).toArray();
      return res.json(workouts);
    }
  } catch (e: any) {
    console.error('Workouts fetch error:', e?.message);
  }
  res.json(userId ? memoryStore.workouts.filter(w => w.userId === userId) : memoryStore.workouts);
});

app.post('/api/workouts', async (req, res) => {
  const workout = req.body;
  if (!workout || !workout.id) {
    return res.status(400).json({ error: 'Invalid workout payload' });
  }
  try {
    const db = await getDb();
    if (db) {
      await db.collection('data').updateOne(
        { id: workout.id },
        { $set: { ...workout, dataType: 'workout' } },
        { upsert: true }
      );
      return res.json({ success: true, workout, storedIn: 'MongoDB' });
    }
  } catch (e: any) {
    console.error('Workouts write error:', e?.message);
  }
  memoryStore.workouts.unshift(workout);
  res.json({ success: true, workout, storedIn: 'Memory' });
});

// Routines handlers
app.get('/api/routines', async (req, res) => {
  const userId = req.query.userId as string;
  try {
    const db = await getDb();
    if (db) {
      const query: any = { dataType: 'routine' };
      if (userId) query.$or = [{ createdBy: userId }, { isPreset: true }];
      const routines = await db.collection('data').find(query).toArray();
      return res.json(routines);
    }
  } catch (e: any) {
    console.error('Routines fetch error:', e?.message);
  }
  res.json(memoryStore.routines);
});

app.post('/api/routines', async (req, res) => {
  const routine = req.body;
  try {
    const db = await getDb();
    if (db) {
      await db.collection('data').updateOne(
        { id: routine.id },
        { $set: { ...routine, dataType: 'routine' } },
        { upsert: true }
      );
      return res.json({ success: true, routine, storedIn: 'MongoDB' });
    }
  } catch (e: any) {
    console.error('Routines write error:', e?.message);
  }
  memoryStore.routines.push(routine);
  res.json({ success: true, routine, storedIn: 'Memory' });
});

// Production static file routing config
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IronCrew Server running on port ${PORT}`);
  });
}

export default app;
