const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011' };
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

describe('Leaderboard Controller Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/leaderboard', () => {
    test('should return sorted leaderboard and current user rank', async () => {
      const mockUsers = [
        {
          _id: '507f1f77bcf86cd799439012',
          username: 'user1',
          ecoPoints: 500,
          sustainabilityScore: 90,
          toObject: function() { return this; }
        },
        {
          _id: '507f1f77bcf86cd799439011', // current user
          username: 'user2',
          ecoPoints: 300,
          sustainabilityScore: 80,
          toObject: function() { return this; }
        }
      ];

      User.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });

      const res = await request(app).get('/api/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leaderboard).toHaveLength(2);
      expect(res.body.data.leaderboard[0].rank).toBe(1);
      expect(res.body.data.leaderboard[1].rank).toBe(2);
      expect(res.body.data.userRank).toBe(2);
    });

    test('should return null userRank if user not in leaderboard limit', async () => {
      const mockUsers = [
        {
          _id: '507f1f77bcf86cd799439012',
          username: 'user1',
          ecoPoints: 500,
          sustainabilityScore: 90,
          toObject: function() { return this; }
        }
      ];

      User.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });

      const res = await request(app).get('/api/leaderboard?limit=1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userRank).toBeNull();
    });
  });
});
