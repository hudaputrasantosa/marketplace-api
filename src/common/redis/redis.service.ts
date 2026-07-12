import { Redis } from "ioredis";
import { config } from "../config/env";

/**
 * Thin shared Redis client, ready to use for caching or key/value storage.
 * ioredis multiplexes every command over a single persistent connection - there is no
 * separate "pool" of connections to manage, this instance is created once and reused
 * everywhere via the `redisService` singleton below.
 * Uses lazyConnect so importing this module doesn't require Redis to be up
 * (e.g. during typecheck/tests) - the connection opens on first command.
 */
export class RedisService {
  readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, "EX", ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Health check used for the startup connectivity log. */
  async ping(): Promise<void> {
    await this.client.ping();
  }

  /** Immediately terminates the connection - prefer `close()` for graceful shutdown. */
  disconnect(): void {
    this.client.disconnect();
  }

  /** Flushes in-flight commands and closes the connection cleanly. */
  async close(): Promise<void> {
    await this.client.quit();
  }
}

export const redisService = new RedisService();
