import { redisClient } from '../config/redis.config';
import { config } from '../config/env.config';

const CACHE_PREFIX = 'category:';

export class CacheService {

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) as T : null;
    } catch {
      return null;
    }
  }

  async set(key: string, data: unknown, ttl?: number): Promise<void> {
    try {
      await redisClient.setEx(key, ttl || config.cache.ttlAll, JSON.stringify(data));
    } catch (err) {
      console.error('Cache set error (non-fatal):', err);
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      console.error('Cache invalidate error (non-fatal):', err);
    }
  }

  keys = {
    all: `${CACHE_PREFIX}all`,
    one: (id: string) => `${CACHE_PREFIX}${id}`,
    search: (term: string) => `${CACHE_PREFIX}search:${term.toLowerCase()}`,
    url: (url: string) => `${CACHE_PREFIX}${url}`,
  };
}
