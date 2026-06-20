const request = require('supertest');
const app = require('../../src/app');
const Goal = require('../../src/models/Goal');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011', totalEmission: 250 };
    next();
  }
}));

// Mock Goal model
jest.mock('../../src/models/Goal');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Goal Controller Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/goals', () => {
    test('should create a goal successfully', async () => {
      const payload = {
        title: 'Reduce Car Travel',
        targetEmission: '150',
        currentEmission: '200',
        deadline: '2026-12-31'
      };
      const mockGoal = {
        _id: 'goal123',
        userId: '507f1f77bcf86cd799439011',
        title: 'Reduce Car Travel',
        targetEmission: 150,
        currentEmission: 200,
        progress: 25,
        status: 'active'
      };
      Goal.create.mockResolvedValue(mockGoal);

      const res = await request(app)
        .post('/api/goals')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/goals')
        .send({ targetEmission: 100 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 400 if targetEmission is invalid range', async () => {
      const res = await request(app)
        .post('/api/goals')
        .send({ title: 'Goal 1', targetEmission: -100 });

      expect(res.status).toBe(400);
    });

    test('should return 500 on goal creation exception', async () => {
      Goal.create.mockRejectedValue(new Error('Mongoose write failed'));

      const res = await request(app)
        .post('/api/goals')
        .send({ title: 'Goal 1', targetEmission: 100 });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/goals', () => {
    test('should retrieve goals for user', async () => {
      Goal.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ title: 'Reduce Car Travel' }])
      });

      const res = await request(app).get('/api/goals');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 500 on retrieve goals error', async () => {
      Goal.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Db read error'))
      });

      const res = await request(app).get('/api/goals');

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /api/goals/:id', () => {
    test('should update a goal successfully', async () => {
      const mockGoal = {
        _id: '507f1f77bcf86cd799439012',
        currentEmission: 200,
        targetEmission: 150
      };
      Goal.findOne.mockResolvedValue(mockGoal);
      Goal.findOneAndUpdate.mockResolvedValue({
        ...mockGoal,
        progress: 25
      });

      const res = await request(app)
        .put('/api/goals/507f1f77bcf86cd799439012')
        .send({ currentEmission: 180, targetEmission: 120 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 400 if no valid fields are provided to update', async () => {
      const res = await request(app)
        .put('/api/goals/507f1f77bcf86cd799439012')
        .send({});

      expect(res.status).toBe(400);
    });

    test('should return 400 for invalid ObjectId', async () => {
      const res = await request(app)
        .put('/api/goals/invalid-id')
        .send({ title: 'New title' });

      expect(res.status).toBe(400);
    });

    test('should return 404 if goal to update not found', async () => {
      Goal.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/goals/507f1f77bcf86cd799439012')
        .send({ title: 'New title' });

      expect(res.status).toBe(404);
    });

    test('should return 500 on goal update exception', async () => {
      Goal.findOneAndUpdate.mockRejectedValue(new Error('Db error'));

      const res = await request(app)
        .put('/api/goals/507f1f77bcf86cd799439012')
        .send({ title: 'New title' });

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/goals/:id', () => {
    test('should delete a goal successfully', async () => {
      Goal.findOneAndDelete.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });

      const res = await request(app).delete('/api/goals/507f1f77bcf86cd799439012');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 400 for invalid ObjectId', async () => {
      const res = await request(app).delete('/api/goals/invalid-id');

      expect(res.status).toBe(400);
    });

    test('should return 404 if goal not found', async () => {
      Goal.findOneAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/api/goals/507f1f77bcf86cd799439012');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should return 500 on goal delete exception', async () => {
      Goal.findOneAndDelete.mockRejectedValue(new Error('Db connection error'));

      const res = await request(app).delete('/api/goals/507f1f77bcf86cd799439012');

      expect(res.status).toBe(500);
    });
  });
});
