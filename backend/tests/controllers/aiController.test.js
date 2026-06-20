const request = require('supertest');
const app = require('../../src/app');
const CarbonRecord = require('../../src/models/CarbonRecord');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011' };
    next();
  }
}));

// Mock Mongoose models
jest.mock('../../src/models/CarbonRecord');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('AI Controller Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/recommendations', () => {
    test('should return local recommendations when Gemini key is invalid/missing', async () => {
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      process.env.GEMINI_API_KEY = 'YOUR_KEY_HERE'; // Trigger invalid key

      const res = await request(app)
        .post('/api/ai/recommendations')
        .send({
          emissionData: {
            transportEmission: 100,
            electricityEmission: 80,
            foodEmission: 60,
            lifestyleEmission: 40,
            totalEmission: 280,
            sustainabilityScore: 50
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('local');
      expect(res.body.data.summary).toContain('280.0 kg');
    });
  });

  describe('POST /api/ai/chat', () => {
    test('should return local chat response when Gemini key is invalid/missing', async () => {
      CarbonRecord.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          totalEmission: 280,
          transportEmission: 100,
          electricityEmission: 80,
          foodEmission: 60,
          lifestyleEmission: 40,
          sustainabilityScore: 50
        })
      });

      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'reduce transport emissions' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('local');
      expect(res.body.data.message).toContain('Transport (100.0 kg)');
    });

    test('should return 400 for empty messages', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: ' ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
