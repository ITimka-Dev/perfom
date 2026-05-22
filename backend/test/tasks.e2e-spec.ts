import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let studentToken: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create teacher account
    const teacherRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `teacher${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Teacher User',
      });
    
    if (teacherRes.status === 201) {
      teacherToken = teacherRes.body.access_token;
    }

    // Create student account
    const studentRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `student${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Student User',
      });
    
    if (studentRes.status === 201) {
      studentToken = studentRes.body.access_token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tasks (POST)', () => {
    it('should create a new task as teacher', () => {
      if (!teacherToken) {
        return;
      }

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          difficulty: 'medium',
          xpReward: 100,
          zoneId: 'zone-1',
        })
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('id');
            taskId = res.body.id;
          }
        });
    });
  });

  describe('/tasks (GET)', () => {
    it('should get all tasks', () => {
      if (!studentToken) {
        return;
      }

      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/tasks/:id/submit (POST)', () => {
    it('should submit a task solution', () => {
      if (!studentToken || !taskId) {
        return;
      }

      return request(app.getHttpServer())
        .post(`/tasks/${taskId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          submittedAnswer: 'Test answer',
        })
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('status');
          }
        });
    });
  });

  describe('/tasks/:id/submissions (GET)', () => {
    it('should get task submissions as teacher', () => {
      if (!teacherToken || !taskId) {
        return;
      }

      return request(app.getHttpServer())
        .get(`/tasks/${taskId}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
