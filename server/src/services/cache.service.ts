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
      let keysToDelete: string[] = [];
      for await (const key of redisClient.scanIterator({ MATCH: `${CACHE_PREFIX}*`, COUNT: 100 })) {
        keysToDelete.push(key);
        if (keysToDelete.length >= 100) {
          await redisClient.del(keysToDelete);
          keysToDelete = [];
        }
      }
      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
      }
    } catch (err) {
      console.error('Cache invalidate error (non-fatal):', err);
    }
  }

  keys = {
    domain: {
      all: `${CACHE_PREFIX}domain:all`,
      subtree: (id: string) => `${CACHE_PREFIX}domain:tree:${id}`,
      one: (id: string) => `${CACHE_PREFIX}domain:${id}`,
    },
  };
}
