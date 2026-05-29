import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service';

const cache = new CacheService();

export const cacheMiddleware = (ttlSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.params.id ? cache.keys.http.one(req.params.id) : cache.keys.http.url(req.originalUrl);

    cache.get<any>(key)
      .then((cached) => {
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', key);
          res.status(200).json(cached);
          return;
        }

        res.setHeader('X-Cache', 'MISS');

        const originalJson = res.json.bind(res);
        res.json = (body: unknown): Response => {
          if (res.statusCode === 200) {
            cache.set(key, body, ttlSeconds);
          }
          return originalJson(body);
        };

        next();
      })
      .catch((err) => {
        console.error('Cache middleware error (non-fatal):', err);
        next();
      });
  };
};
