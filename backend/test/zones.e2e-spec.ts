import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ZonesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/zones (GET)', () => {
    it('should get all zones', () => {
      return request(app.getHttpServer())
        .get('/zones')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/zones/:id (GET)', () => {
    it('should get zone by ID', async () => {
      // First get all zones to get an ID
      const zonesRes = await request(app.getHttpServer())
        .get('/zones');

      if (zonesRes.body.length > 0) {
        const zoneId = zonesRes.body[0].id;

        return request(app.getHttpServer())
          .get(`/zones/${zoneId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name');
          });
      }
    });

    it('should return empty result for non-existent zone', () => {
      return request(app.getHttpServer())
        .get('/zones/non-existent-id')
        .expect(200);
    });
  });
});
