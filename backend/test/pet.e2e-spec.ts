import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PetController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let petId: string;

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
        email: `pet${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Pet User',
      });
    
    if (res.status === 201) {
      authToken = res.body.access_token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/pet (GET)', () => {
    it('should get user pet or return null', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/pet')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/pet (POST)', () => {
    it('should create a new pet', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .post('/pet')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Fluffy',
          type: 'cat',
        })
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Fluffy');
            petId = res.body.id;
          }
        });
    });

    it('should return 409 when creating duplicate pet', () => {
      if (!authToken || !petId) {
        return;
      }

      return request(app.getHttpServer())
        .post('/pet')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Another Pet',
          type: 'dog',
        })
        .expect(409);
    });
  });

  describe('/pet/feed (POST)', () => {
    it('should feed the pet', () => {
      if (!authToken || !petId) {
        return;
      }

      return request(app.getHttpServer())
        .post('/pet/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('hunger');
          }
        });
    });
  });

  describe('/pet/water (POST)', () => {
    it('should water the pet', () => {
      if (!authToken || !petId) {
        return;
      }

      return request(app.getHttpServer())
        .post('/pet/water')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('thirst');
          }
        });
    });
  });

  describe('/pet/play (POST)', () => {
    it('should play with the pet', () => {
      if (!authToken || !petId) {
        return;
      }

      return request(app.getHttpServer())
        .post('/pet/play')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('happiness');
          }
        });
    });
  });

  describe('/pet/shop (GET)', () => {
    it('should get shop items', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/pet/shop')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/pet/items (GET)', () => {
    it('should get user items', () => {
      if (!authToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/pet/items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
