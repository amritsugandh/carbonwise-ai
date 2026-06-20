const request = require('supertest');
const app = require('../../src/app');
const CarbonRecord = require('../../src/models/CarbonRecord');
const { getChatResponse, getRecommendationsResponse } = require('../../src/utils/localAI');

// Mock localAI
jest.mock('../../src/utils/localAI', () => {
  const original = jest.requireActual('../../src/utils/localAI');
  return {
    getChatResponse: jest.fn().mockImplementation((msg, rec) => original.getChatResponse(msg, rec)),
    getRecommendationsResponse: jest.fn().mockImplementation((data) => original.getRecommendationsResponse(data))
  };
});

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

// Mock Mongoose models
jest.mock('../../src/models/CarbonRecord');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('AI Controller Endpoints', () => {
  const emissionData = {
    transportEmission: 100,
    electricityEmission: 80,
    foodEmission: 60,
    lifestyleEmission: 40,
    totalEmission: 280,
    sustainabilityScore: 50
  };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'AIzaSyFakeKey';
  });

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
        .send({ emissionData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('local');
      expect(res.body.data.summary).toContain('280.0 kg');
    });

    test('should call Gemini API and parse JSON output successfully', async () => {
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const mockAiResponse = {
        summary: "This is a custom AI summary.",
        topIssue: "Transport 100kg",
        tips: [],
        weeklyPlan: [],
        offsetSuggestions: []
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockAiResponse)
        }
      });

      const res = await request(app)
        .post('/api/ai/recommendations')
        .send({ emissionData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBe(mockAiResponse.summary);
    });

    test('should fallback to local recommendations if Gemini API output is invalid JSON', async () => {
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Invalid JSON text"
        }
      });

      const res = await request(app)
        .post('/api/ai/recommendations')
        .send({ emissionData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toContain('280.0 kg'); // Local fallback summary format
    });

    test('should fallback to local recommendations on Gemini API exception', async () => {
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      mockGenerateContent.mockRejectedValue(new Error('Quota Exceeded'));

      const res = await request(app)
        .post('/api/ai/recommendations')
        .send({ emissionData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('local');
    });

    test('should return 500 when both Gemini and local recommendations fail', async () => {
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      mockGenerateContent.mockRejectedValue(new Error('Quota Exceeded'));
      getRecommendationsResponse.mockImplementationOnce(() => {
        throw new Error('Local fallback failed');
      });

      const res = await request(app)
        .post('/api/ai/recommendations')
        .send({ emissionData });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('AI service unavailable');
    });
  });

  describe('POST /api/ai/chat', () => {
    test('should return local chat response when Gemini key is invalid/missing', async () => {
      CarbonRecord.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        jest: jest.fn(),
        mockResolvedValue: jest.fn()
      });
      CarbonRecord.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis()
      });
      CarbonRecord.findOne().sort.mockResolvedValue({
        totalEmission: 280,
        transportEmission: 100,
        electricityEmission: 80,
        foodEmission: 60,
        lifestyleEmission: 40,
        sustainabilityScore: 50
      });

      process.env.GEMINI_API_KEY = 'YOUR_KEY_HERE';

      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'reduce transport emissions' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('local');
    });

    test('should return Gemini response if key is valid', async () => {
      CarbonRecord.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis()
      });
      CarbonRecord.findOne().sort.mockResolvedValue(null);

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "This is Gemini's custom response."
        }
      });

      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'tips' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("This is Gemini's custom response.");
    });

    test('should return local fallback on Gemini error', async () => {
      CarbonRecord.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis()
      });
      CarbonRecord.findOne().sort.mockResolvedValue({
        totalEmission: 280,
        transportEmission: 100,
        electricityEmission: 80,
        foodEmission: 60,
        lifestyleEmission: 40,
        sustainabilityScore: 50
      });

      mockGenerateContent.mockRejectedValue(new Error('429 quota exceeded'));

      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'diet' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('quota exceeded');
    });

    test('should return 500 when both Gemini and local chat fail', async () => {
      CarbonRecord.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis()
      });
      CarbonRecord.findOne().sort.mockResolvedValue(null);

      mockGenerateContent.mockRejectedValue(new Error('Some API error'));
      getChatResponse.mockImplementationOnce(() => {
        throw new Error('Local fallback failed');
      });

      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'tips' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('AI service temporarily unavailable');
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
