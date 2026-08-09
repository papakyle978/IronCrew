import dotenv from 'dotenv';
dotenv.config();

// FIX: Explicitly add the .ts extension so Node's ESM loader can resolve it!
import app from '../server.ts'; 

export default app;
