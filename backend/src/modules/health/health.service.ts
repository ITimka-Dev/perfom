import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HealthCheckResult, ServiceStatus } from './dto/health-check.dto';

@Injectable()
export class HealthService {
  private supabase: SupabaseClient;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const [dbResult, redisResult, storageResult] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        status: 'down' as const, 
        error: (result.reason as Error)?.message || 'Unknown error' 
      }
    );

    const responseTime = Date.now() - startTime;
    const allHealthy = [dbResult, redisResult, storageResult]
      .every(check => check.status === 'up');

    const result: HealthCheckResult = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      services: {
        database: dbResult,
        redis: redisResult,
        storage: storageResult,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV') || 'development',
    };

    if (!allHealthy) {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }

  async checkDatabase(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      
      // Simple query to check connection
      await this.dataSource.query('SELECT 1');
      
      // Check if we can access user table
      const userCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM "users"'
      );
      
      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
        details: {
          connected: true,
          userCount: parseInt(userCount[0].count),
        },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        details: {
          connected: false,
        },
      };
    }
  }

  async checkRedis(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      
      // Test cache read/write
      const testKey = 'health_check_test';
      const testValue = 'ok';
      
      await this.cacheManager.set(testKey, testValue, 10000); // 10 seconds TTL
      const retrievedValue = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);
      
      const responseTime = Date.now() - startTime;
      const isWorking = retrievedValue === testValue;

      return {
        status: isWorking ? 'up' : 'down',
        responseTime,
        details: {
          connected: true,
          readWrite: isWorking,
          cacheType: this.configService.get('NODE_ENV') === 'production' ? 'redis' : 'memory',
        },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        details: {
          connected: false,
        },
      };
    }
  }

  async checkStorage(): Promise<ServiceStatus> {
    try {
      if (!this.supabase) {
        return {
          status: 'down',
          error: 'Supabase client not configured',
        };
      }

      const startTime = Date.now();
      
      // Try to list buckets
      const { data, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }

      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
        details: {
          connected: true,
          bucketsCount: data?.length || 0,
        },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        details: {
          connected: false,
        },
      };
    }
  }
}
