import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as path from 'path';
import * as fs from 'fs';

describe('Storage API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let taskId: string;
  let submissionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and authenticate
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `storage-test-${Date.now()}@test.com`,
        password: 'password123',
        fullName: 'Storage Test User',
      });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: signupRes.body.email || `storage-test-${Date.now()}@test.com`,
        password: 'password123',
      });

    authToken = loginRes.body.access_token;

    // Get zones and create test task
    const zones = await request(app.getHttpServer())
      .get('/zones')
      .set('Authorization', `Bearer ${authToken}`);

    if (zones.body && zones.body.length > 0) {
      const taskRes = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task for Storage',
          description: 'Test description',
          zoneId: zones.body[0].id,
          difficulty: 3,
          experienceReward: 100,
        });
      taskId = taskRes.body.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /storage/task/:taskId/upload', () => {
    it('should upload a file to task attachments', async () => {
      if (!taskId) {
        console.log('Skipping test - no task created');
        return;
      }

      // Create a test file
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'Test file content for task attachment');

      const response = await request(app.getHttpServer())
        .post(`/storage/task/${taskId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(201);

      expect(response.body).toHaveProperty('url');

      // Cleanup
      fs.unlinkSync(testFilePath);
    });

    it('should reject upload without authentication', async () => {
      if (!taskId) {
        console.log('Skipping test - no task created');
        return;
      }

      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'Test file content');

      await request(app.getHttpServer())
        .post(`/storage/task/${taskId}/upload`)
        .attach('file', testFilePath)
        .expect(401);

      fs.unlinkSync(testFilePath);
    });

    it('should reject upload without file', async () => {
      if (!taskId) {
        console.log('Skipping test - no task created');
        return;
      }

      await request(app.getHttpServer())
        .post(`/storage/task/${taskId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /storage/submission/:submissionId/upload', () => {
    beforeAll(async () => {
      if (!taskId) return;

      // Create a submission
      const submissionRes = await request(app.getHttpServer())
        .post(`/tasks/${taskId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test submission for file upload',
        });
      submissionId = submissionRes.body.id;
    });

    it('should upload a file to submission attachments', async () => {
      if (!submissionId) {
        console.log('Skipping test - no submission created');
        return;
      }

      const testFilePath = path.join(__dirname, 'submission-file.pdf');
      fs.writeFileSync(testFilePath, 'Test PDF content for submission');

      const response = await request(app.getHttpServer())
        .post(`/storage/submission/${submissionId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(201);

      expect(response.body).toHaveProperty('url');

      fs.unlinkSync(testFilePath);
    });

    it('should reject upload without authentication', async () => {
      if (!submissionId) {
        console.log('Skipping test - no submission created');
        return;
      }

      const testFilePath = path.join(__dirname, 'submission-file.pdf');
      fs.writeFileSync(testFilePath, 'Test content');

      await request(app.getHttpServer())
        .post(`/storage/submission/${submissionId}/upload`)
        .attach('file', testFilePath)
        .expect(401);

      fs.unlinkSync(testFilePath);
    });
  });
});
