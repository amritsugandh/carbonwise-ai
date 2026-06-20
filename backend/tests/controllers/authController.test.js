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

  describe('User Schema Methods', () => {
    test('toJSON method should exclude __v', () => {
      // Create a dummy instance and test toJSON
      const userInstance = {
        username: 'test',
        email: 'test@example.com',
        __v: 0,
        toObject: function() {
          return { username: this.username, email: this.email, __v: this.__v };
        }
      };

      // Get schema toJSON definition from Mongoose mock if needed, or call it directly since User model is mocked.
      // Wait, since User is mocked, we can require the real User schema to test it directly!
      const UserReal = jest.requireActual('../../src/models/User');
      const realUser = new UserReal({
        firebaseUID: 'fb123',
        email: 'test@example.com',
        username: 'test'
      });
      const json = realUser.toJSON();
      expect(json.__v).toBeUndefined();
    });
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

    test('should return existing user and update avatar if changed', async () => {
      const existingUser = {
        _id: 'user123',
        firebaseUID: 'fb123',
        email: 'existing@example.com',
        avatar: 'old-avatar',
        username: 'old'
      };
      User.findOne.mockResolvedValue(existingUser);
      User.findByIdAndUpdate.mockResolvedValue({
        ...existingUser,
        avatar: 'new-avatar'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firebaseUID: 'fb123',
          email: 'existing@example.com',
          avatar: 'new-avatar'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should return 400 if firebaseUID or email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-uid@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should handle duplicate key errors (code 11000) and return existing email account', async () => {
      const dbError = new Error('Duplicate key');
      dbError.code = 11000;
      User.findOne.mockRejectedValueOnce(dbError);

      User.findOne.mockResolvedValueOnce({
        _id: 'user123',
        email: 'dup@example.com'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ firebaseUID: 'fb123', email: 'dup@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('user123');
    });

    test('should return 500 on standard register exceptions', async () => {
      User.findOne.mockRejectedValue(new Error('Connection failure'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ firebaseUID: 'fb123', email: 'test@example.com' });

      expect(res.status).toBe(500);
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

    test('should handle standard exceptions inside login endpoint', async () => {
      const { login } = require('../../src/controllers/authController');
      const req = {
        get user() {
          throw new Error('Fatal login error');
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
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

    test('should return 500 on db errors', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB connection lost'))
      });

      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(500);
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

    test('should return 500 on profile update exceptions', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Profile update failed'));

      const res = await request(app)
        .put('/api/auth/profile')
        .send({ username: 'error' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
