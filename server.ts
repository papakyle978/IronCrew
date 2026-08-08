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

  // MongoDB connection helper
  const mongodbUri = process.env.MONGODB_URI || '';
  const isMongoDBConfigured = Boolean(mongodbUri.trim());

  let cachedDb: Db | null = null;
  let connectionFailed = false;

  async function getDb(forceRetry = false): Promise<Db | null> {
    if (cachedDb) return cachedDb;
    if (!isMongoDBConfigured) return null;
    if (connectionFailed && !forceRetry) return null;

    try {
      const client = new MongoClient(mongodbUri, {
        serverSelectionTimeoutMS: 2500,
        connectTimeoutMS: 2500,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });
      await client.connect();
      cachedDb = client.db('ironcrew_db');
      connectionFailed = false;
      return cachedDb;
    } catch (err: any) {
      connectionFailed = true;
      return null;
    }
  }

  // API Routes
  app.get('/api/health', async (req, res) => {
    const forceRetry = req.query.retry === 'true';
    const db = await getDb(forceRetry);
    res.json({
      status: 'ok',
      service: 'IronCrew Strength API',
      database: db
        ? 'MongoDB Atlas (Connected)'
        : isMongoDBConfigured
        ? 'Local Store (MongoDB Connection Error)'
        : 'Local In-Memory Store (Ready for MONGODB_URI)',
      mongodbUriConfigured: isMongoDBConfigured,
      vercelReady: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Vercel deployment helper guide endpoint
  app.get('/api/vercel-guide', (req, res) => {
    res.json({
      title: 'Connecting IronCrew to Vercel & MongoDB Atlas',
      steps: [
        {
          step: 1,
          title: 'Export Code to GitHub',
          description: 'Use the Export to GitHub option in AI Studio menu to push your repo.'
        },
        {
          step: 2,
          title: 'Import in Vercel',
          description: 'Go to vercel.com/new and import your GitHub repository.'
        },
        {
          step: 3,
          title: 'Add Environment Variable',
          description: 'In Vercel -> Settings -> Environment Variables, add MONGODB_URI.'
        },
        {
          step: 4,
          title: 'Deploy',
          description: 'Click Deploy. Vercel automatically builds and deploys your full-stack app.'
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
    console.log(`IronCrew Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
