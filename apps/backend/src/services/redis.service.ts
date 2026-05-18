import { createClient, RedisClientType } from 'redis';
import { logger } from '@silentsiren/logger';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    const client = this.getClient();
    if (expirySeconds) {
      await client.setEx(key, expirySeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    const client = this.getClient();
    return await client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    const client = this.getClient();
    await client.expire(key, seconds);
  }

  // Geospatial operations
  async geoAdd(key: string, longitude: number, latitude: number, member: string): Promise<void> {
    const client = this.getClient();
    await client.geoAdd(key, {
      longitude,
      latitude,
      member,
    });
  }

  async geoRadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: 'm' | 'km' | 'ft' | 'mi' = 'm'
  ): Promise<string[]> {
    const client = this.getClient();
    const results = await client.geoRadius(key, { longitude, latitude }, radius, unit);
    return results.map((r: any) => (typeof r === 'string' ? r : r.member || r));
  }

  async geoPos(
    key: string,
    member: string
  ): Promise<{ longitude: number; latitude: number } | null> {
    const client = this.getClient();
    const positions = await client.geoPos(key, member);
    if (!positions || positions.length === 0 || !positions[0]) {
      return null;
    }
    return {
      longitude: Number(positions[0].longitude),
      latitude: Number(positions[0].latitude),
    };
  }

  // Hash operations
  async hSet(key: string, field: string, value: string): Promise<void> {
    const client = this.getClient();
    await client.hSet(key, field, value);
  }

  async hGet(key: string, field: string): Promise<string | undefined> {
    const client = this.getClient();
    return await client.hGet(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    const client = this.getClient();
    return await client.hGetAll(key);
  }

  async hDel(key: string, field: string): Promise<void> {
    const client = this.getClient();
    await client.hDel(key, field);
  }

  // Set operations
  async sAdd(key: string, member: string): Promise<void> {
    const client = this.getClient();
    await client.sAdd(key, member);
  }

  async sMembers(key: string): Promise<string[]> {
    const client = this.getClient();
    return await client.sMembers(key);
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    const client = this.getClient();
    return await client.sIsMember(key, member);
  }

  async sCard(key: string): Promise<number> {
    const client = this.getClient();
    return await client.sCard(key);
  }

  // Sorted set operations
  async zAdd(key: string, score: number, member: string): Promise<void> {
    const client = this.getClient();
    await client.zAdd(key, { score, value: member });
  }

  async zRangeByScore(key: string, min: number, max: number): Promise<string[]> {
    const client = this.getClient();
    return await client.zRangeByScore(key, min, max);
  }

  async zRemRangeByScore(key: string, min: number, max: number): Promise<void> {
    const client = this.getClient();
    await client.zRemRangeByScore(key, min, max);
  }
}

export const redisService = new RedisService();
