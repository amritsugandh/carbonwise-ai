const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011', username: 'testuser', email: 'test@example.com' };
    next();
  }
}));

// Mock User model
jest.mock('../../src/models/User');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Auth Controller Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        firebaseUID: 'fb123',
        email: 'new@example.com',
        username: 'new'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firebaseUID: 'fb123',
          email: 'new@example.com',
          username: 'new'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('User registered successfully');
      expect(User.create).toHaveBeenCalled();
    });

    test('should return existing user if registered already', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user123',
        firebaseUID: 'fb123',
        email: 'existing@example.com',
        avatar: 'old-avatar'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firebaseUID: 'fb123',
          email: 'existing@example.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('User already exists');
    });

    test('should return 400 if firebaseUID or email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-uid@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should return authenticated user', async () => {
      const res = await request(app).post('/api/auth/login');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should return populated user profile', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com'
        })
      });

      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
    });

    test('should return 404 if user profile is not found', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    test('should update profile fields successfully', async () => {
      User.findByIdAndUpdate.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        username: 'updatedname'
      });

      const res = await request(app)
        .put('/api/auth/profile')
        .send({ username: 'updatedname' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('updatedname');
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should return 400 if no valid fields are provided', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
