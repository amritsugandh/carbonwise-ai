const request = require('supertest');
const app = require('../../src/app');
const Prediction = require('../../src/models/Prediction');
const CarbonRecord = require('../../src/models/CarbonRecord');

// Mock @google/generative-ai
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent
});
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel
      };
    })
  };
});

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
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'AIzaSyFakeKey';
  });

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

    test('should generate forecast with Gemini AI insights successfully', async () => {
      const mockHistory = [
        { totalEmission: 200, createdAt: new Date() }
      ];
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockHistory)
      });

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "```json\n[\"Reduce car emissions\", \"Switch to LEDs\", \"Go veggie\"]\n```"
        }
      });

      const mockPrediction = {
        _id: 'pred123',
        userId: '507f1f77bcf86cd799439011',
        predictedNextMonth: 210,
        aiInsights: ["Reduce car emissions", "Switch to LEDs", "Go veggie"]
      };

      Prediction.findOneAndUpdate.mockResolvedValue(mockPrediction);

      const res = await request(app).post('/api/predictions/generate');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.aiInsights).toEqual(expect.arrayContaining(["Reduce car emissions"]));
    });

    test('should use local fallback prediction insights if Gemini throws error', async () => {
      const mockHistory = [
        { totalEmission: 200, createdAt: new Date() }
      ];
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockHistory)
      });

      mockGenerateContent.mockRejectedValue(new Error('Quota exceeded'));

      Prediction.findOneAndUpdate.mockImplementation((query, update, options) => {
        return Promise.resolve({
          _id: 'pred123',
          ...update
        });
      });

      const res = await request(app).post('/api/predictions/generate');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.aiInsights).toHaveLength(3); // Should trigger local fallback array
    });

    test('should return 500 on db errors', async () => {
      CarbonRecord.find.mockImplementation(() => {
        throw new Error('Database disconnected');
      });

      const res = await request(app).post('/api/predictions/generate');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
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

    test('should return 500 on db errors', async () => {
      Prediction.findOne.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Db error'))
      });

      const res = await request(app).get('/api/predictions/latest');

      expect(res.status).toBe(500);
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

    test('should return 500 on db errors', async () => {
      Prediction.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Db error'))
      });

      const res = await request(app).get('/api/predictions/history');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
