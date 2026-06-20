const request = require('supertest');
const app = require('../src/app');

// Mock Mongoose models since routes will require database models
jest.mock('../src/models/User');
jest.mock('../src/models/CarbonRecord');

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('App Entry Points and CORS Configuration', () => {
  test('GET / should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Welcome to the CarbonWise API');
  });

  test('GET /health should return server status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('CORS should block request if origin is not allowed', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://unauthorized-domain.com');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('CORS blocked: http://unauthorized-domain.com');
  });

  test('CORS should allow request if origin is allowed', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.header['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('CORS should allow request if origin is not present (e.g. curl/Postman/backend test)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});
