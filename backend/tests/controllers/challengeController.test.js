const request = require('supertest');
const app = require('../../src/app');
const Challenge = require('../../src/models/Challenge');
const User = require('../../src/models/User');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011' };
    next();
  }
}));

// Mock Mongoose models
jest.mock('../../src/models/Challenge');
jest.mock('../../src/models/User');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Challenge Controller Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/challenges', () => {
    test('should retrieve challenges and check completion status', async () => {
      const mockChallenges = [
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Plant 5 Trees',
          points: 100,
          toObject: function() { return this; }
        }
      ];
      Challenge.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockChallenges)
      });

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        completedChallenges: ['507f1f77bcf86cd799439012']
      };
      User.findById.mockResolvedValue(mockUser);

      const res = await request(app).get('/api/challenges');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].isCompleted).toBe(true);
    });
  });

  describe('POST /api/challenges/complete', () => {
    test('should successfully complete a challenge and award points and badges', async () => {
      const mockChallenge = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Plant 5 Trees',
        points: 100,
        badge: 'Tree Planter',
        icon: '🌳'
      };
      Challenge.findById.mockResolvedValue(mockChallenge);

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        ecoPoints: 50,
        completedChallenges: [],
        badges: [],
        toObject: function() { return this; }
      };
      User.findById.mockResolvedValue(mockUser);

      User.findByIdAndUpdate.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ecoPoints: 150,
        badges: [{ name: 'Tree Planter', icon: '🌳' }]
      });

      const res = await request(app)
        .post('/api/challenges/complete')
        .send({ challengeId: '507f1f77bcf86cd799439012' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pointsEarned).toBe(100);
      expect(res.body.totalPoints).toBe(150);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should return 400 if challenge already completed', async () => {
      const mockChallenge = {
        _id: '507f1f77bcf86cd799439012',
        points: 100
      };
      Challenge.findById.mockResolvedValue(mockChallenge);

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        completedChallenges: ['507f1f77bcf86cd799439012'],
        badges: [],
        toObject: function() { return this; }
      };
      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/challenges/complete')
        .send({ challengeId: '507f1f77bcf86cd799439012' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already completed');
    });

    test('should return 404 if challenge does not exist', async () => {
      Challenge.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/challenges/complete')
        .send({ challengeId: '507f1f77bcf86cd799439012' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
