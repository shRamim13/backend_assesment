import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from './config/env.config';
import { connectDB, disconnectDB } from './config/db.config';
import { connectRedis, disconnectRedis, redisClient } from './config/redis.config';
import categoryRoutes from './routes/category.routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { ERR } from './constants/messages';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/api/categories', categoryRoutes);

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

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: ERR.ROUTE_NOT_FOUND(req.method, req.originalUrl),
    timestamp: new Date().toISOString(),
  });
});

app.use(errorMiddleware);

const start = async (): Promise<void> => {
  try {
    await connectDB();
    await connectRedis();

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
