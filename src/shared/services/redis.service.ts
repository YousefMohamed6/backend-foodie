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

  constructor(private configService: ConfigService) {}

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
      await this.client.quit();
    }
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
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

  async get<T = string>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        // Attempt to parse as JSON if it's an object/array string
        return JSON.parse(value) as T;
      } catch {
        // If parsing fails, return as is (plain string)
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
}
