import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      url: `redis://${this.configService.get('REDIS_HOST')}:${this.configService.get('REDIS_PORT')}`,
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));

    await this.client.connect();
    console.log('🔗 Redis connected for Stage Truth synchronization');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async hSet(key: string, field: string, value: string) {
    return await this.client.hSet(key, field, value);
  }

  async hGet(key: string, field: string) {
    return await this.client.hGet(key, field);
  }

  async hGetAll(key: string) {
    return await this.client.hGetAll(key);
  }

  async publish(channel: string, message: string) {
    return await this.client.publish(channel, message);
  }

  async incr(key: string) {
    return await this.client.incr(key);
  }
}
