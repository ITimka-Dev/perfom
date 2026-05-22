import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and get auth token
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

    authToken = signupResponse.body.access_token;

    // Create teacher user
    const teacherSignup = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'teacher@example.com',
        password: 'password123',
        fullName: 'Test Teacher',
      });

    teacherToken = teacherSignup.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/profile (GET)', () => {
    it('should return user profile', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('fullName');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });
  });

  describe('/users/profile (PUT)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Updated Name',
          schoolName: 'Test School',
          grade: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullName).toBe('Updated Name');
        });
    });
  });

  describe('/users/teacher/subjects (GET)', () => {
    it('should return teacher subjects', () => {
      return request(app.getHttpServer())
        .get('/users/teacher/subjects')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users/teacher/stats (GET)', () => {
    it('should return teacher statistics', () => {
      return request(app.getHttpServer())
        .get('/users/teacher/stats')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalStudents');
          expect(res.body).toHaveProperty('pendingReviews');
          expect(res.body).toHaveProperty('reviewedToday');
          expect(res.body).toHaveProperty('avgGrade');
        });
    });
  });

  describe('/users/teacher/students (GET)', () => {
    it('should return students list', () => {
      return request(app.getHttpServer())
        .get('/users/teacher/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
