import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../shared/services/redis.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `rate_limit:${ip}:${req.path}`;
    const limit = 100; // requests
    const window = 60; // seconds

    try {
      const count = await this.redisService.get(key);
      const currentCount = count ? parseInt(count, 10) : 0;

      if (currentCount >= limit) {
        return res.status(429).json({
          statusCode: 429,
          message: 'Too many requests, please try again later.',
        });
      }

      await this.redisService.set(key, (currentCount + 1).toString(), window);

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        (limit - currentCount - 1).toString(),
      );
      res.setHeader(
        'X-RateLimit-Reset',
        (Date.now() + window * 1000).toString(),
      );

      next();
    } catch (error) {
      // If Redis fails, allow request (fail open)
      next();
    }
  }
}
