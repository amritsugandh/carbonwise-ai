const { errorHandler, notFound } = require('../../src/middleware/errorHandler');
const { generalLimiter, aiLimiter, authLimiter } = require('../../src/middleware/rateLimiter');

// Simple logger mock
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

describe('Middleware Tests', () => {
  describe('errorHandler', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        path: '/test-path',
        method: 'GET',
        ip: '127.0.0.1'
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    test('should handle ValidationError and return 400', () => {
      const valError = new Error('Validation failed');
      valError.name = 'ValidationError';
      valError.errors = {
        name: { message: 'Name is required' }
      };

      errorHandler(valError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation Error',
        errors: ['Name is required']
      });
    });

    test('should handle CastError and return 400', () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      castError.path = 'id';
      castError.value = '123';

      errorHandler(castError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid id: 123'
      });
    });

    test('should handle duplicate key error (code 11000) and return 409', () => {
      const dupError = new Error('Duplicate key');
      dupError.code = 11000;
      dupError.keyValue = { email: 'test@example.com' };

      errorHandler(dupError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'email already exists'
      });
    });

    test('should handle JsonWebTokenError and return 401', () => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      errorHandler(jwtError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
    });

    test('should handle TokenExpiredError and return 401', () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';

      errorHandler(expiredError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired'
      });
    });

    test('should handle default errors and return 500 in dev mode', () => {
      const error = new Error('Something went wrong');
      process.env.NODE_ENV = 'development';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Something went wrong'
      }));
    });
  });

  describe('notFound middleware', () => {
    test('should respond with 404', () => {
      const mockReq = { method: 'POST', originalUrl: '/unknown' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      notFound(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Route POST /unknown not found'
      });
    });
  });

  describe('Rate Limiter configs', () => {
    test('should export rate limiters', () => {
      expect(generalLimiter).toBeDefined();
      expect(aiLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
    });
  });
});
