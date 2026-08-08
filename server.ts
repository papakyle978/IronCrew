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

  // MongoDB connection setup
  const DEFAULT_MONGODB_URI = 'mongodb+srv://papakyle978_db_user:mUyKU1qr4ufEKV9Y@cluster0.r5sysjm.mongodb.net/ironcrew_db?retryWrites=true&w=majority&appName=Cluster0';
  const mongodbUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  const isMongoDBConfigured = Boolean(mongodbUri.trim());

  let cachedDb: Db | null = null;
  let connectionFailed = false;
  let lastDbError = '';

  async function getDb(forceRetry = false): Promise<Db | null> {
    if (cachedDb) return cachedDb;
    if (!isMongoDBConfigured) return null;
    if (connectionFailed && !forceRetry) return null;

    try {
      const client = new MongoClient(mongodbUri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
      });
      await client.connect();
      cachedDb = client.db('ironcrew_db');
      connectionFailed = false;
      lastDbError = '';
      return cachedDb;
    } catch (err: any) {
      connectionFailed = true;
      lastDbError = err?.message || String(err);
      console.error('MongoDB Atlas connection error:', lastDbError);
      return null;
    }
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
    const db = await getDb(forceRetry);
    res.json({
      status: 'ok',
      service: 'IronCrew Strength API',
      database: db
        ? 'MongoDB Atlas (Connected)'
        : 'Local In-Memory Store (Atlas Connection Offline/Pending)',
      mongodbUriConfigured: isMongoDBConfigured,
      activeUri: mongodbUri.replace(/:[^:@]+@/, ':****@'),
      lastConnectionError: lastDbError || null,
      atlasTroubleshooting: !db ? [
        '1. Ensure Network Access in MongoDB Atlas allows 0.0.0.0/0 (Allow Access from Anywhere).',
        '2. Verify Database User credentials (papakyle978_db_user).',
        '3. Check that the cluster is active and accepting connections.'
      ] : [],
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
        await db.collection('users').updateOne(
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
        foundUser = await db.collection('users').findOne({
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
        const u = await db.collection('users').findOne({ id: userId });
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
        await db.collection('users').updateOne({ id: userId }, { $set: updated }, { upsert: true });
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
        const query = userId ? { userId } : {};
        const workouts = await db.collection('workouts').find(query).sort({ startTime: -1 }).toArray();
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
        await db.collection('workouts').updateOne({ id: workout.id }, { $set: workout }, { upsert: true });
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
        const query = userId ? { $or: [{ createdBy: userId }, { isPreset: true }] } : {};
        const routines = await db.collection('routines').find(query).toArray();
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
        await db.collection('routines').updateOne({ id: routine.id }, { $set: routine }, { upsert: true });
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
        const feed = await db.collection('feed').find({}).sort({ timestamp: -1 }).toArray();
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
        await db.collection('feed').updateOne({ id: post.id }, { $set: post }, { upsert: true });
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
        const p = await db.collection('feed').findOne({ id: postId });
        if (p) {
          const likes: string[] = p.likes || [];
          const updatedLikes = likes.includes(userId)
            ? likes.filter(id => id !== userId)
            : [...likes, userId];
          await db.collection('feed').updateOne({ id: postId }, { $set: { likes: updatedLikes } });
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
