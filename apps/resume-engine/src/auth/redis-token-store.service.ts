import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export const REFRESH_TOKEN_KEY_PREFIX = 'auth:refresh:';

export interface RefreshTokenRecord {
  userId: string;
  email: string;
}

@Injectable()
export class RedisTokenStoreService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async saveRefreshToken(
    jti: string,
    record: RefreshTokenRecord,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      `${REFRESH_TOKEN_KEY_PREFIX}${jti}`,
      JSON.stringify(record),
      'EX',
      ttlSeconds,
    );
  }

  async getRefreshToken(jti: string): Promise<RefreshTokenRecord | null> {
    const value = await this.redis.get(`${REFRESH_TOKEN_KEY_PREFIX}${jti}`);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as RefreshTokenRecord;
    } catch {
      return null;
    }
  }

  async deleteRefreshToken(jti: string): Promise<void> {
    await this.redis.del(`${REFRESH_TOKEN_KEY_PREFIX}${jti}`);
  }
}
