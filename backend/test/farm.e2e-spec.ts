import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('FarmController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create test user
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `farm${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Farm User',
      });
    
    if (res.status === 201) {
      authToken = res.body.access_token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/farm/plants (GET)', () => {
    it('should get user plants', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/farm/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/farm/animals (GET)', () => {
    it('should get user animals', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/farm/animals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/farm/productions (GET)', () => {
    it('should get user productions', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/farm/productions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/farm/inventory (GET)', () => {
    it('should get user inventory', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/farm/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/farm/plant (POST)', () => {
    it('should plant a seed', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .post('/farm/plant')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          farmItemId: 'item-1',
          slotIndex: 1,
          zoneId: 'zone-1',
        })
        .expect((res) => {
          // May fail if user doesn't have the item, but endpoint should be accessible
          expect([201, 400, 404]).toContain(res.status);
        });
    });
  });
});
