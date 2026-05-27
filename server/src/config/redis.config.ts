import { createClient, RedisClientType } from 'redis';
import { config } from './env.config';

export let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  redisClient = createClient({ url: config.redisUrl }) as RedisClientType;

  redisClient.on('error', (err) =>
    console.error('Redis error:', err.message)
  );
  redisClient.on('connect', () => console.log('Redis connected'));
  redisClient.on('reconnecting', () => console.warn('Redis reconnecting...'));

  await redisClient.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  await redisClient.quit();
};
