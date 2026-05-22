import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrometheusInterceptor } from './common/interceptors/prometheus.interceptor';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Redis adapter for Socket.io (horizontal scaling)
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Prometheus metrics interceptor
  const prometheusInterceptor = app.get(PrometheusInterceptor);
  app.useGlobalInterceptors(prometheusInterceptor);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EduFarm API')
    .setDescription('Educational Farm Game API - A gamified learning platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('tasks', 'Educational tasks')
    .addTag('zones', 'Learning zones')
    .addTag('farm', 'Farm management')
    .addTag('pet', 'Virtual pet (Tamagotchi)')
    .addTag('achievements', 'User achievements')
    .addTag('progress', 'User progress and levels')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api`);
}
bootstrap();
