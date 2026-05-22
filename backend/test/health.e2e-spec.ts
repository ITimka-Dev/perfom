import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('services');
          expect(res.body.services).toHaveProperty('database');
          expect(res.body.services).toHaveProperty('redis');
          expect(res.body.services).toHaveProperty('storage');
        });
    });

    it('should have all services up', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.services.database.status).toBe('up');
          expect(res.body.services.redis.status).toBe('up');
        });
    });
  });

  describe('/health/database (GET)', () => {
    it('should return database status', () => {
      return request(app.getHttpServer())
        .get('/health/database')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('up');
          expect(res.body.details).toHaveProperty('connected');
        });
    });
  });

  describe('/health/redis (GET)', () => {
    it('should return redis status', () => {
      return request(app.getHttpServer())
        .get('/health/redis')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('up');
          expect(res.body.details).toHaveProperty('connected');
        });
    });
  });

  describe('/health/storage (GET)', () => {
    it('should return storage status', () => {
      return request(app.getHttpServer())
        .get('/health/storage')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });
  });
});
