import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export const redisConfig = async (): Promise<CacheModuleOptions> => {
  const isProduction = process.env.NODE_ENV === 'production';
  const redisUrl = process.env.REDIS_URL;

  if (isProduction && redisUrl) {
    return {
      store: redisStore as any,
      url: redisUrl,
      ttl: 300, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
      isGlobal: true,
    };
  }

  // In-memory cache for development
  return {
    ttl: 300,
    max: 100,
    isGlobal: true,
  };
};
