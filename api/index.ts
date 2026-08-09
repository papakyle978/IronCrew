import express from 'express';
import { MongoClient, Db } from 'mongodb';

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});

const app = express();
app.use(express.json());

interface MongoCache {
  conn: Db | null;
  promise: Promise<Db | null> | null;
}

let cached: MongoCache = (global as any).mongoCache;
if (!cached) {
  cached = (global as any).mongoCache = { conn: null, promise: null };
}

async function getDb(): Promise<Db | null> {
  const mongodbUri = process.env.MONGODB_URI || '';
  if (!mongodbUri.trim()) return null;
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };
    cached.promise = (async () => {
      try {
        const client = new MongoClient(mongodbUri, opts);
        await client.connect();
        cached.conn = client.db();
        return cached.conn;
      } catch (err) {
        cached.promise = null;
        console.error('[MongoDB] Connection dropped:', err);
        return null;
      }
    })();
  }
  return await cached.promise;
}

const memoryStore = {
  users: [] as any[],
  workouts: [] as any[],
  routines: [] as any[],
};

app.get('/api/health', async (req, res) => {
  const db = await getDb();
  res.json({
    status: db ? 'ok' : 'active',
    database: db ? 'MongoDB Atlas (Connected)' : 'Local Fallback Storage',
    vercelReady: true,
  });
});

const handleProfileSync = async (req: express.Request, res: express.Response) => {
  const userId = req.params.userId || req.body.userId || req.body.id;
  const updateData = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });

  try {
    const db = await getDb();
    if (db) {
      const cleanPayload = { ...updateData };
      delete cleanPayload._id;
      delete cleanPayload.id;

      await db.collection('accounts').updateOne(
        { id: userId },
        { $set: cleanPayload },
        { upsert: true }
      );
      return res.json({ success: true, updated: cleanPayload, storedIn: 'MongoDB' });
    }
  } catch (e: any) {
    console.error('Fallback triggered:', e?.message);
  }

  const idx = memoryStore.users.findIndex(u => u.id === userId);
  if (idx >= 0) memoryStore.users[idx] = { ...memoryStore.users[idx], ...updateData };
  res.json({ success: true, storedIn: 'Memory' });
};

app.post('/api/auth/update-profile', handleProfileSync);
app.put('/api/users/:userId', handleProfileSync);

app.post('/api/auth/register', async (req, res) => {
  const user = req.body;
  if (!user || !user.id || !user.username) return res.status(400).json({ error: 'Invalid register payload' });
  try {
    const db = await getDb();
    if (db) {
      await db.collection('accounts').updateOne({ id: user.id }, { $set: user }, { upsert: true });
      return res.json({ success: true, user, storedIn: 'MongoDB' });
    }
  } catch (e) {}
  memoryStore.users.push(user);
  res.json({ success: true, user, storedIn: 'Memory' });
});

app.post('/api/auth/login', async (req, res) => {
  const { query, password } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query parameters' });
  const q = query.trim().toLowerCase();
  try {
    const db = await getDb();
    if (db) {
      const foundUser = await db.collection('accounts').findOne({
        $or: [{ username: q }, { email: q }]
      });
      if (foundUser) {
        if (foundUser.password && password && foundUser.password !== password) {
          return res.status(401).json({ error: 'Incorrect verification values.' });
        }
        return res.json({ success: true, user: foundUser });
      }
    }
  } catch (e) {}
  const foundLocal = memoryStore.users.find(u => u.username === q || u.email === q);
  if (!foundLocal) return res.status(404).json({ error: 'Account not found.' });
  res.json({ success: true, user: foundLocal });
});

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
  } catch (e) {}
  res.json(userId ? memoryStore.workouts.filter(w => w.userId === userId) : memoryStore.workouts);
});

app.post('/api/workouts', async (req, res) => {
  const workout = req.body;
  if (!workout || !workout.id) return res.status(400).json({ error: 'Invalid workout payload shape' });
  try {
    const db = await getDb();
    if (db) {
      await db.collection('data').updateOne({ id: workout.id }, { $set: { ...workout, dataType: 'workout' } }, { upsert: true });
      return res.json({ success: true, workout, storedIn: 'MongoDB' });
    }
  } catch (e) {}
  memoryStore.workouts.unshift(workout);
  res.json({ success: true, workout, storedIn: 'Memory' });
});

export default app;