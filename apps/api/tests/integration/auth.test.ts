import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Auth API', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  let refreshToken: string;
  let accessToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new teacher account', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test Teacher',
        email: testEmail,
        password: 'Test@12345',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();

      refreshToken = res.body.data.refreshToken;
      accessToken = res.body.data.accessToken;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test Teacher',
        email: testEmail,
        password: 'Test@12345',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test',
        email: 'weak@test.com',
        password: 'weak',
      });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'Test@12345',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'WrongPass@123',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should issue new access token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testEmail);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
