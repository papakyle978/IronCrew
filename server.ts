import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MongoClient, Db } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      };

      cached.promise = (async () => {
        try {
          console.log('[MongoDB] Connecting to cluster database "local"...');
          const client = new MongoClient(mongodbUri, opts);
          await client.connect();
          const db = client.db('local');
          console.log('[MongoDB] Successfully connected to "local" database!');
          cached.conn = db;
          cached.lastError = null;
          return db;
        } catch (err: any) {
          cached.promise = null;
          cached.lastError = err?.message || String(err);
          console.error('[MongoDB] Connection error:', cached.lastError);
          return null;
        }
      })();
    }

    return await cached.promise;
  }

  // In-Memory Fallback Store (Used when MONGODB_URI is absent or unavailable)
  const memoryStore = {
    users: [] as any[],
    workouts: [] as any[],
    routines: [] as any[],
    exercises: [] as any[],
    feed: [] as any[],
  };

  // API Routes

  // Health check
  app.get('/api/health', async (req, res) => {
    const forceRetry = req.query.retry === 'true';
    const isMongoDBConfigured = Boolean((process.env.MONGODB_URI || '').trim());
    const db = await getDb(forceRetry);
    res.json({
      status: 'ok',
      service: 'IronCrew Strength API',
      database: db
        ? 'MongoDB Atlas (Connected)'
        : isMongoDBConfigured
        ? 'Local In-Memory Store (Atlas Connection Offline/Pending)'
        : 'Local In-Memory Store (Ready for MONGODB_URI)',
      targetDatabase: 'local',
      collections: ['accounts', 'data'],
      mongodbUriConfigured: isMongoDBConfigured,
      connectionError: cached.lastError || null,
      authTroubleshooting: cached.lastError?.toLowerCase().includes('auth') ? [
        'MongoDB Atlas rejected the database username or password.',
        '1. Go to MongoDB Atlas -> Security -> Database Access.',
        '2. Verify or reset the password for your Database User.',
        '3. If the password contains special characters (e.g., @, #, :, /), make sure they are URL-encoded in MONGODB_URI (%40, %23, %3A, %2F).',
        '4. Update MONGODB_URI in Vercel / Environment Variables and redeploy.'
      ] : null,
      vercelReady: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    const user = req.body;
    if (!user || !user.id || !user.username) {
      return res.status(400).json({ error: 'Invalid user payload' });
    }

    const db = await getDb();
    if (db) {
      try {
        await db.collection('accounts').updateOne(
          { id: user.id },
          { $set: user },
          { upsert: true }
        );
      } catch (e: any) {
        console.error('MongoDB register error:', e?.message);
      }
    }

    // Keep in-memory copy
    const idx = memoryStore.users.findIndex(u => u.id === user.id);
    if (idx >= 0) memoryStore.users[idx] = user;
    else memoryStore.users.push(user);

    res.json({ success: true, user });
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    const { query, password } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing username or email' });

    const q = query.trim().toLowerCase();
    const db = await getDb();

    let foundUser: any = null;

    if (db) {
      try {
        foundUser = await db.collection('accounts').findOne({
          $or: [
            { username: q },
            { email: q }
          ]
        });
      } catch (e: any) {
        console.error('MongoDB login error:', e?.message);
      }
    }

    if (!foundUser) {
      foundUser = memoryStore.users.find(
        u => u.username?.toLowerCase() === q || u.email?.toLowerCase() === q
      );
    }

    if (!foundUser) {
      return res.status(404).json({ error: 'User not found. Please check your credentials or sign up.' });
    }

    if (foundUser.password && password && foundUser.password !== password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    res.json({ success: true, user: foundUser });
  });

  // User Profile
  app.get('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const db = await getDb();

    if (db) {
      try {
        const u = await db.collection('accounts').findOne({ id: userId });
        if (u) return res.json(u);
      } catch (e) {}
    }

    const localUser = memoryStore.users.find(u => u.id === userId);
    if (localUser) return res.json(localUser);

    res.status(404).json({ error: 'User not found' });
  });

  app.put('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const updated = req.body;
    const db = await getDb();

    if (db) {
      try {
        await db.collection('accounts').updateOne({ id: userId }, { $set: updated }, { upsert: true });
      } catch (e) {}
    }

    const idx = memoryStore.users.findIndex(u => u.id === userId);
    if (idx >= 0) memoryStore.users[idx] = { ...memoryStore.users[idx], ...updated };
    else memoryStore.users.push(updated);

    res.json({ success: true });
  });

  // Workouts (saving reps, sets, weights, PRs)
  app.get('/api/workouts', async (req, res) => {
    const userId = req.query.userId as string;
    const db = await getDb();

    if (db) {
      try {
        const query: any = { dataType: 'workout' };
        if (userId) query.userId = userId;
        const workouts = await db.collection('data').find(query).sort({ startTime: -1 }).toArray();
        return res.json(workouts);
      } catch (e) {}
    }

    const filtered = userId
      ? memoryStore.workouts.filter(w => w.userId === userId)
      : memoryStore.workouts;
    res.json(filtered);
  });

  app.post('/api/workouts', async (req, res) => {
    const workout = req.body;
    if (!workout || !workout.id) {
      return res.status(400).json({ error: 'Invalid workout payload' });
    }

    const db = await getDb();
    if (db) {
      try {
        await db.collection('data').updateOne(
          { id: workout.id },
          { $set: { ...workout, dataType: 'workout' } },
          { upsert: true }
        );
      } catch (e) {}
    }

    const idx = memoryStore.workouts.findIndex(w => w.id === workout.id);
    if (idx >= 0) memoryStore.workouts[idx] = workout;
    else memoryStore.workouts.unshift(workout);

    res.json({ success: true, workout });
  });

  // Routines
  app.get('/api/routines', async (req, res) => {
    const userId = req.query.userId as string;
    const db = await getDb();

    if (db) {
      try {
        const query: any = { dataType: 'routine' };
        if (userId) query.$or = [{ createdBy: userId }, { isPreset: true }];
        const routines = await db.collection('data').find(query).toArray();
        return res.json(routines);
      } catch (e) {}
    }

    res.json(memoryStore.routines);
  });

  app.post('/api/routines', async (req, res) => {
    const routine = req.body;
    const db = await getDb();

    if (db) {
      try {
        await db.collection('data').updateOne(
          { id: routine.id },
          { $set: { ...routine, dataType: 'routine' } },
          { upsert: true }
        );
      } catch (e) {}
    }

    memoryStore.routines.push(routine);
    res.json({ success: true, routine });
  });

  // Feed Activity
  app.get('/api/feed', async (req, res) => {
    const db = await getDb();
    if (db) {
      try {
        const feed = await db.collection('data').find({ dataType: 'feed' }).sort({ timestamp: -1 }).toArray();
        return res.json(feed);
      } catch (e) {}
    }
    res.json(memoryStore.feed);
  });

  app.post('/api/feed', async (req, res) => {
    const post = req.body;
    const db = await getDb();
    if (db) {
      try {
        await db.collection('data').updateOne(
          { id: post.id },
          { $set: { ...post, dataType: 'feed' } },
          { upsert: true }
        );
      } catch (e) {}
    }

    memoryStore.feed.unshift(post);
    res.json({ success: true, post });
  });

  app.post('/api/feed/:postId/like', async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body;
    const db = await getDb();

    if (db) {
      try {
        const p = await db.collection('data').findOne({ id: postId, dataType: 'feed' });
        if (p) {
          const likes: string[] = p.likes || [];
          const updatedLikes = likes.includes(userId)
            ? likes.filter(id => id !== userId)
            : [...likes, userId];
          await db.collection('data').updateOne(
            { id: postId, dataType: 'feed' },
            { $set: { likes: updatedLikes } }
          );
        }
      } catch (e) {}
    }

    const post = memoryStore.feed.find(p => p.id === postId);
    if (post) {
      if (post.likes.includes(userId)) {
        post.likes = post.likes.filter((id: string) => id !== userId);
      } else {
        post.likes.push(userId);
      }
    }

    res.json({ success: true });
  });

  // Vercel guide endpoint
  app.get('/api/vercel-guide', (req, res) => {
    res.json({
      title: 'Connecting IronCrew to Vercel & MongoDB Atlas',
      steps: [
        {
          step: 1,
          title: 'Export Code to GitHub',
          description: 'Use the Export to GitHub option in AI Studio settings.'
        },
        {
          step: 2,
          title: 'Import in Vercel',
          description: 'Go to vercel.com/new and import your GitHub repository.'
        },
        {
          step: 3,
          title: 'Set Environment Variables',
          description: 'In Vercel -> Project Settings -> Environment Variables, add MONGODB_URI.'
        },
        {
          step: 4,
          title: 'Deploy',
          description: 'Vercel will build and host your app with live MongoDB Atlas integration.'
        }
      ]
    });
  });

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IronCrew Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
