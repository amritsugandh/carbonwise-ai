const { authenticate } = require('../../src/middleware/auth');
const { initializeFirebase, getFirebaseAdmin } = require('../../src/config/firebase');
const admin = require('firebase-admin');
const User = require('../../src/models/User');

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const verifyIdTokenMock = jest.fn();
  const authMock = jest.fn(() => ({
    verifyIdToken: verifyIdTokenMock
  }));
  return {
    initializeApp: jest.fn().mockReturnValue({ name: 'mockedFirebaseApp' }),
    credential: {
      cert: jest.fn()
    },
    auth: authMock,
    _verifyIdTokenMock: verifyIdTokenMock
  };
});

// Mock User model
jest.mock('../../src/models/User');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Auth Middleware & Firebase Config Tests', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  describe('Firebase Initialization', () => {
    test('should warn and return null if FIREBASE_PROJECT_ID is not configured', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      let app;
      jest.isolateModules(() => {
        const { initializeFirebase: localInit } = require('../../src/config/firebase');
        app = localInit();
      });
      expect(app).toBeNull();
    });

    test('should initialize Firebase Admin if credentials are provided', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test-email';

      let app;
      jest.isolateModules(() => {
        const { initializeFirebase: localInit } = require('../../src/config/firebase');
        app = localInit();
      });
      expect(app).toBeDefined();
      expect(admin.initializeApp).toHaveBeenCalled();
    });

    test('should handle Firebase initialization errors gracefully', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test-email';

      admin.initializeApp.mockImplementationOnce(() => {
        throw new Error('Init error');
      });

      let app;
      jest.isolateModules(() => {
        const { initializeFirebase: localInit } = require('../../src/config/firebase');
        app = localInit();
      });
      expect(app).toBeNull();
    });
  });

  describe('authenticate middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    test('should return 401 if Authorization header is missing', async () => {
      await authenticate(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No token provided'
      }));
    });

    test('should return 401 if Authorization header does not start with Bearer', async () => {
      mockReq.headers.authorization = 'Basic 12345';
      await authenticate(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No token provided'
      }));
    });

    test('should return 503 if Firebase Auth is not configured', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      delete process.env.FIREBASE_PROJECT_ID;

      let localAuthenticate;
      jest.isolateModules(() => {
        const { authenticate: localAuth } = require('../../src/middleware/auth');
        localAuthenticate = localAuth;
      });

      await localAuthenticate(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication service not configured. Set Firebase credentials in backend/.env'
      }));
    });

    test('should call next() and attach user to req if token is valid and user exists', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test-email';

      const decoded = { uid: 'fb123', email: 'test@example.com', name: 'Test User', picture: 'pic.png' };
      admin._verifyIdTokenMock.mockResolvedValueOnce(decoded);

      const existingUser = { firebaseUID: 'fb123', email: 'test@example.com' };
      User.findOne.mockResolvedValueOnce(existingUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ firebaseUID: 'fb123' });
      expect(mockReq.user).toEqual(existingUser);
      expect(mockReq.firebaseUser).toEqual(decoded);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should create user if token is valid but user does not exist in DB', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test-email';

      const decoded = { uid: 'fb123', email: 'test@example.com', name: 'Test User', picture: 'pic.png' };
      admin._verifyIdTokenMock.mockResolvedValueOnce(decoded);

      User.findOne.mockResolvedValueOnce(null);
      const newUser = { firebaseUID: 'fb123', email: 'test@example.com', username: 'Test User', avatar: 'pic.png' };
      User.create.mockResolvedValueOnce(newUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(User.create).toHaveBeenCalledWith({
        firebaseUID: 'fb123',
        email: 'test@example.com',
        username: 'Test User',
        avatar: 'pic.png'
      });
      expect(mockReq.user).toEqual(newUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle user creation with default username if decoded.name is missing', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test-email';

      const decoded = { uid: 'fb123', email: 'test@example.com' };
      admin._verifyIdTokenMock.mockResolvedValueOnce(decoded);

      User.findOne.mockResolvedValueOnce(null);
      const newUser = { firebaseUID: 'fb123', email: 'test@example.com', username: 'test', avatar: '' };
      User.create.mockResolvedValueOnce(newUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(User.create).toHaveBeenCalledWith({
        firebaseUID: 'fb123',
        email: 'test@example.com',
        username: 'test',
        avatar: ''
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 401 if token verification throws error', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test-email';

      admin._verifyIdTokenMock.mockRejectedValueOnce(new Error('Token verification failed'));

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid or expired token'
      }));
    });
  });
});
