const request = require('supertest');
const app = require('../../src/app');
const Report = require('../../src/models/Report');
const CarbonRecord = require('../../src/models/CarbonRecord');
const Goal = require('../../src/models/Goal');
const Prediction = require('../../src/models/Prediction');
const User = require('../../src/models/User');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011' };
    next();
  }
}));

// Mock models
jest.mock('../../src/models/Report');
jest.mock('../../src/models/CarbonRecord');
jest.mock('../../src/models/Goal');
jest.mock('../../src/models/Prediction');
jest.mock('../../src/models/User');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Report Controller Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/reports/generate', () => {
    test('should generate and save a report successfully', async () => {
      User.findById.mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com',
        ecoPoints: 100,
        sustainabilityScore: 80
      });

      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            totalEmission: 200,
            transportEmission: 80,
            electricityEmission: 60,
            foodEmission: 40,
            lifestyleEmission: 20,
            createdAt: new Date()
          }
        ])
      });

      Goal.find.mockResolvedValue([
        { title: 'Goal 1', targetEmission: 150, progress: 20, status: 'active' }
      ]);

      Prediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          predictedNextMonth: 210,
          trend: { direction: 'increasing', percentageChange: 5 },
          riskLevel: { level: 'Low', color: 'yellow' },
          aiInsights: ['Insight 1']
        })
      });

      Report.create.mockResolvedValue({
        _id: 'report123',
        reportData: { summary: { totalRecords: 1 } }
      });

      const res = await request(app).post('/api/reports/generate');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportId).toBe('report123');
      expect(Report.create).toHaveBeenCalled();
    });

    test('should generate report without records, goals, or prediction', async () => {
      User.findById.mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com'
      });

      CarbonRecord.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Goal.find.mockResolvedValue([]);

      Prediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      });

      Report.create.mockResolvedValue({
        _id: 'report123',
        reportData: {}
      });

      const res = await request(app).post('/api/reports/generate');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 500 on report generation failure', async () => {
      User.findById.mockRejectedValue(new Error('Database disconnected'));

      const res = await request(app).post('/api/reports/generate');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/reports', () => {
    test('should fetch all reports for user', async () => {
      Report.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: 'r1' }, { _id: 'r2' }])
      });

      const res = await request(app).get('/api/reports');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    test('should return 500 on get reports db exception', async () => {
      Report.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Connection failure'))
      });

      const res = await request(app).get('/api/reports');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/download/:id', () => {
    test('should download report data successfully', async () => {
      Report.findOne.mockResolvedValue({
        _id: 'report123',
        reportData: { user: { name: 'testuser' } }
      });

      const res = await request(app).get('/api/reports/download/report123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportData.user.name).toBe('testuser');
    });

    test('should return 404 if report not found', async () => {
      Report.findOne.mockResolvedValue(null);

      const res = await request(app).get('/api/reports/download/report123');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should return 500 on download db exception', async () => {
      Report.findOne.mockRejectedValue(new Error('Connection failure'));

      const res = await request(app).get('/api/reports/download/report123');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
