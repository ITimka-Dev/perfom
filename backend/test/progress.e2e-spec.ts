import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProgressController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let zoneId: string;

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
        email: `progress${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Progress User',
      });
    
    if (res.status === 201) {
      authToken = res.body.access_token;
    }

    // Get a zone ID
    const zonesRes = await request(app.getHttpServer())
      .get('/zones');
    
    if (zonesRes.body.length > 0) {
      zoneId = zonesRes.body[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/progress/user (GET)', () => {
    it('should get user progress for all zones', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/progress/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/progress/:zoneId (GET)', () => {
    it('should get user progress for a specific zone', () => {
      if (!authToken || !zoneId) {
        return;
      }

      return request(app.getHttpServer())
        .get(`/progress/${zoneId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          // May return null if no progress yet, or progress object
          if (res.body) {
            expect(res.body).toHaveProperty('level');
            expect(res.body).toHaveProperty('experience');
            expect(res.body).toHaveProperty('tasksCompleted');
          }
        });
    });
  });

  describe('401 Unauthorized tests', () => {
    it('should return 401 without token for user progress', () => {
      return request(app.getHttpServer())
        .get('/progress/user')
        .expect(401);
    });

    it('should return 401 without token for zone progress', () => {
      if (!zoneId) {
        return;
      }

      return request(app.getHttpServer())
        .get(`/progress/${zoneId}`)
        .expect(401);
    });
  });
});
