const request = require('supertest');
const app = require('../../src/app');
const Prediction = require('../../src/models/Prediction');
const CarbonRecord = require('../../src/models/CarbonRecord');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011' };
    next();
  }
}));

// Mock models
jest.mock('../../src/models/Prediction');
jest.mock('../../src/models/CarbonRecord');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Prediction Controller Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/predictions/generate', () => {
    test('should return 400 if no historical data exists', async () => {
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const res = await request(app).post('/api/predictions/generate');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No historical data found');
    });

    test('should generate and save forecast when historical data is present', async () => {
      const mockHistory = [
        { totalEmission: 200, createdAt: new Date() }
      ];
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockHistory)
      });

      const mockPrediction = {
        _id: 'pred123',
        userId: '507f1f77bcf86cd799439011',
        predictedNextMonth: 210,
        aiInsights: ['Insight 1', 'Insight 2', 'Insight 3']
      };

      Prediction.findOneAndUpdate.mockResolvedValue(mockPrediction);

      // Set key to trigger AI key check validation path (or not, since it falls back either way)
      process.env.GEMINI_API_KEY = 'YOUR_API_KEY';

      const res = await request(app).post('/api/predictions/generate');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.predictedNextMonth).toBe(210);
      expect(Prediction.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('GET /api/predictions/latest', () => {
    test('should fetch latest prediction', async () => {
      const mockPrediction = { _id: 'p1', predictedNextMonth: 200 };
      Prediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPrediction)
      });

      const res = await request(app).get('/api/predictions/latest');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.predictedNextMonth).toBe(200);
    });

    test('should return 404 if no prediction exists', async () => {
      Prediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app).get('/api/predictions/latest');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/predictions/history', () => {
    test('should fetch prediction history list', async () => {
      const mockHistory = [{ _id: 'p1' }, { _id: 'p2' }];
      Prediction.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockHistory)
      });

      const res = await request(app).get('/api/predictions/history');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });
});
