const request = require('supertest');
const app = require('../../src/app');
const CarbonRecord = require('../../src/models/CarbonRecord');
const User = require('../../src/models/User');

// Mock authentication middleware to bypass Firebase
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011', totalEmission: 250, ecoPoints: 120 };
    next();
  }
}));

// Mock Mongoose models
jest.mock('../../src/models/CarbonRecord');
jest.mock('../../src/models/User');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Carbon Controller Endpoints', () => {
  const validPayload = {
    transport: { vehicleType: 'car_petrol', dailyDistance: 10, daysPerWeek: 5 },
    electricity: { monthlyUnits: 100 },
    food: { dietType: 'vegan' },
    lifestyle: { shoppingFrequency: 'sometimes', plasticConsumption: 'medium' }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/carbon/calculate', () => {
    test('should calculate emissions without database access', async () => {
      const res = await request(app)
        .post('/api/carbon/calculate')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEmission).toBeGreaterThan(0);
    });

    test('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/carbon/calculate')
        .send({ transport: {} }); // Missing other fields

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('electricity data is required');
    });
  });

  describe('POST /api/carbon/save', () => {
    test('should save record and update user stats', async () => {
      const mockRecord = {
        _id: 'record123',
        userId: '507f1f77bcf86cd799439011',
        totalEmission: 212.47
      };
      CarbonRecord.create.mockResolvedValue(mockRecord);
      User.findByIdAndUpdate.mockResolvedValue({});

      const res = await request(app)
        .post('/api/carbon/save')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('record123');
      expect(CarbonRecord.create).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('GET /api/carbon/history', () => {
    test('should retrieve user history with pagination', async () => {
      const mockRecords = [
        { _id: 'r1', totalEmission: 200, createdAt: new Date() }
      ];
      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRecords)
      });
      CarbonRecord.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/carbon/history?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/carbon/stats', () => {
    test('should retrieve aggregated statistics', async () => {
      const mockStats = [{ avgTotal: 212.47, count: 5 }];
      const mockMonthly = [{ _id: { year: 2026, month: 6 }, avgEmission: 212.47 }];

      CarbonRecord.aggregate
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockMonthly);

      const res = await request(app)
        .get('/api/carbon/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toEqual(mockStats[0]);
      expect(res.body.data.monthly).toEqual(mockMonthly);
    });
  });
});
