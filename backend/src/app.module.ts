import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { redisConfig } from './config/redis.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { FarmModule } from './modules/farm/farm.module';
import { PetModule } from './modules/pet/pet.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { ZonesModule } from './modules/zones/zones.module';
import { ProgressModule } from './modules/progress/progress.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { GroupsModule } from './modules/groups/groups.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { AiModule } from './modules/ai/ai.module';
import { winstonConfig } from './config/winston.config';
import { PrometheusInterceptor } from './common/interceptors/prometheus.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    // Cache with Redis (auto-detects production mode)
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: redisConfig,
    }),
    // Rate limiting (production-ready)
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false, // NEVER use true in production - use migrations
        migrationsRun: true, // Auto-run migrations on startup
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TasksModule,
    FarmModule,
    PetModule,
    AchievementsModule,
    ZonesModule,
    ProgressModule,
    MonitoringModule,
    GroupsModule,
    StorageModule,
    HealthModule,
    AiModule,
  ],
  providers: [PrometheusInterceptor],
})
export class AppModule {}
