import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor(private readonly appConfig: AppConfigService) {
    const redisUrl = this.appConfig.getRedisConfig().url;
    const redisOptions = {
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.warn(`Redis connection failed after ${times} attempts`);
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    };

    this.client = new Redis(redisUrl, redisOptions);
    this.subscriber = new Redis(redisUrl, redisOptions);
    this.publisher = new Redis(redisUrl, redisOptions);

    this.client.on('error', (err) => this.logger.error('Redis client error', err.message));
    this.subscriber.on('error', (err) => this.logger.error('Redis subscriber error', err.message));
    this.publisher.on('error', (err) => this.logger.error('Redis publisher error', err.message));
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.warn('Redis connection failed - service will operate in degraded mode');
    }
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => {});
    await this.subscriber.quit().catch(() => {});
    await this.publisher.quit().catch(() => {});
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.publisher.publish(channel, message);
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  async geoAdd(key: string, longitude: number, latitude: number, member: string): Promise<number> {
    return this.client.geoadd(key, longitude, latitude, member);
  }

  async geoRemove(key: string, member: string): Promise<number> {
    return this.client.zrem(key, member);
  }

  async geoRadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: 'km' | 'm' = 'km',
  ): Promise<string[]> {
    const results = await this.client.georadius(
      key,
      longitude,
      latitude,
      radius,
      unit,
      'ASC',
    );
    return results as string[];
  }

  async geoPos(key: string, member: string): Promise<[number, number] | null> {
    const result = await this.client.geopos(key, member);
    if (result && result[0]) {
      return [parseFloat(result[0][0]!), parseFloat(result[0][1]!)];
    }
    return null;
  }
}
