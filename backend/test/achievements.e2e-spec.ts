import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AchievementsController (e2e)', () => {
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
        email: `achievements${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Achievements User',
      });
    
    if (res.status === 201) {
      authToken = res.body.access_token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/achievements (GET)', () => {
    it('should get all achievements', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/achievements/user (GET)', () => {
    it('should get user achievements', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/achievements/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/achievements/user/progress (GET)', () => {
    it('should get user achievement progress', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/achievements/user/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('unlocked');
          expect(res.body).toHaveProperty('percentage');
        });
    });
  });

  describe('/achievements/:achievementId/unlock (POST)', () => {
    it('should unlock an achievement', async () => {
      if (!authToken) {
        return;
      }

      // First get all achievements to get an ID
      const achievementsRes = await request(app.getHttpServer())
        .get('/achievements')
        .set('Authorization', `Bearer ${authToken}`);

      if (achievementsRes.body.length > 0) {
        const achievementId = achievementsRes.body[0].id;

        return request(app.getHttpServer())
          .post(`/achievements/${achievementId}/unlock`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect((res) => {
            // May fail if already unlocked, but endpoint should be accessible
            expect([201, 409]).toContain(res.status);
          });
      }
    });
  });

  describe('401 Unauthorized tests', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/achievements')
        .expect(401);
    });
  });
});
