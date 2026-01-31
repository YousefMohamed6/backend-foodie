import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    const redisConfig = this.configService.get('redis');
    const redisUrl = redisConfig?.url || 'redis://localhost:6379';

    try {
      // Main client for general operations
      this.client = createClient({ url: redisUrl }) as RedisClientType;
      await this.client.connect();
      this.logger.log('Redis client connected');

      // Pub/Sub clients for WebSocket adapter
      this.pubClient = createClient({ url: redisUrl }) as RedisClientType;
      this.subClient = this.pubClient.duplicate() as RedisClientType;

      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

      this.logger.log('Redis pub/sub clients connected');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // Continue without Redis in development
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
    if (this.pubClient) {
      await this.pubClient.close();
    }
    if (this.subClient) {
      await this.subClient.close();
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  getPubClient(): RedisClientType {
    return this.pubClient;
  }

  getSubClient(): RedisClientType {
    return this.subClient;
  }

  /**
   * GENERIC CACHE-ASIDE PATTERN (MANDATORY FOR ALL FETCHES)
   * 
   * @param key The Redis key
   * @param fetcher The function to fetch data from DB if cache misses
   * @param ttlSeconds Standard TTL for valid data
   * @param emptyTtlSeconds Short TTL for empty data ([], null) to prevent caching glitches
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300,
    emptyTtlSeconds: number = 30,
  ): Promise<T> {
    if (!this.client) {
      // If Redis is down, fallback directly to DB
      return fetcher();
    }

    try {
      // 1. Try generic get
      const cached = await this.get<T>(key);
      if (cached !== null && cached !== undefined) {
        // Double check for empty array "stuck" in cache if we want to be paranoid
        // But assuming the SET logic does its job, this is fine.
        return cached;
      }
    } catch (e) {
      this.logger.error(`Redis Read Error for ${key} - Falling back to DB`, e);
    }

    // 2. Fallback to DB
    const data = await fetcher();

    // 3. Save to Redis (Fire and forget, don't block response)
    if (data !== undefined) {
      this.setSmart(key, data, ttlSeconds, emptyTtlSeconds).catch((e) =>
        this.logger.error(`Redis Write Error for ${key}`, e),
      );
    }

    return data;
  }

  /**
   * Smart Set: Uses shorter TTL for empty arrays/nulls
   */
  async setSmart(
    key: string,
    value: any,
    ttl: number,
    emptyTtl: number,
  ): Promise<void> {
    if (!this.client) return;

    let finalTtl = ttl;
    const isEmpty =
      value === null || (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      finalTtl = emptyTtl;
      // Optional: Log when we are caching an empty state
      // this.logger.warn(`Caching EMPTY state for ${key} for ${emptyTtl}s`);
    }

    await this.set(key, value, finalTtl);
  }

  async get<T = string>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        const parsed = JSON.parse(value);
        // Handle case where "null" string was saved
        if (parsed === null) return null;
        return parsed as T;
      } catch {
        // If simple string, return as is
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, expirySeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      // Store nulls as "null" string or handle strictly?
      // Best practice: if value is null/undefined, simple don't set it (cache miss next time)?
      // Or set explicit null to avoid repeated DB hits for non-existent items.
      // Current decision: support caching valid values.
      if (value === undefined) return;

      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);

      if (expirySeconds) {
        await this.client.setEx(key, expirySeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      let count = 0;
      const promises: Promise<any>[] = [];

      // Use scanIterator for non-blocking key scanning
      for await (const key of this.client.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        if (!key) continue;

        promises.push(this.client.del(key));
        count++;

        if (promises.length >= 100) {
          await Promise.all(promises);
          promises.length = 0;
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      if (count > 0) {
        this.logger.log(`Deleted ${count} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(
        `Redis DEL PATTERN error for pattern ${pattern}:`,
        error,
      );
    }
  }
}
