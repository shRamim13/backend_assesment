import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { config } from './config/env.config';
import { connectDB, disconnectDB } from './config/db.config';
import { connectRedis, disconnectRedis, redisClient } from './config/redis.config';
import categoryRoutes from './routes/category.routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { ResponseBuilder } from './utils/response.util';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/api/categories', categoryRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('/health', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'connected';
  try { await redisClient.ping(); } catch { redisStatus = 'disconnected'; }

  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    uptime: `${Math.floor(process.uptime())}s`,
    services: { mongodb: mongoStatus, redis: redisStatus },
    timestamp: new Date().toISOString(),
  });
});

app.get('*', (req: Request, res: Response) => {
  // API and health paths that reached here are genuinely unmatched —
  // return JSON 404 instead of serving the SPA shell.
  if (req.path.startsWith('/api') || req.path === '/health') {
    res.status(404).json(ResponseBuilder.error(`Route ${req.method} ${req.originalUrl} not found`, 404));
    return;
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(errorMiddleware);

const start = async (): Promise<void> => {
  try {
    await connectDB();

    // Redis is a cache, not a hard dependency. If it's down at boot, log and
    // continue — CacheService degrades gracefully and the app serves from Mongo.
    try {
      await connectRedis();
    } catch (err) {
      console.warn(`Redis unavailable at startup, continuing without cache: ${(err as Error).message}`);
    }

    app.listen(config.port, () => {
      console.log(`Server running at http://localhost:${config.port}`);
      console.log(`API at http://localhost:${config.port}/api/categories`);
      console.log(`Health at http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  await disconnectDB();
  await disconnectRedis();
  process.exit(0);
});

start();
