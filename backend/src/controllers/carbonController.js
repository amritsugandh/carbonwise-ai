const CarbonRecord = require('../models/CarbonRecord');
const User = require('../models/User');
const { calculateAll } = require('../utils/carbonCalculator');
const logger = require('../utils/logger');

// ── Input validation helpers ──────────────────────────────────────────────────
const VALID_VEHICLE_TYPES = ['car_petrol', 'car_diesel', 'car_electric', 'motorcycle', 'bus', 'train', 'plane', 'bicycle', 'walking'];
const VALID_DIET_TYPES    = ['vegan', 'vegetarian', 'mixed', 'meat_heavy'];
const VALID_SHOPPING      = ['rarely', 'sometimes', 'often', 'very_often'];
const VALID_PLASTIC       = ['low', 'medium', 'high', 'very_high'];

const validateCarbonInput = (body) => {
  const errors = [];
  const { transport, electricity, food, lifestyle } = body;

  if (!transport || typeof transport !== 'object') {
    errors.push('transport data is required');
  } else {
    if (!VALID_VEHICLE_TYPES.includes(transport.vehicleType)) {
      errors.push(`vehicleType must be one of: ${VALID_VEHICLE_TYPES.join(', ')}`);
    }
    const dist = Number(transport.dailyDistance);
    if (isNaN(dist) || dist < 0 || dist > 2000) {
      errors.push('dailyDistance must be a number between 0 and 2000');
    }
    const days = Number(transport.daysPerWeek);
    if (isNaN(days) || days < 0 || days > 7) {
      errors.push('daysPerWeek must be between 0 and 7');
    }
  }

  if (!electricity || typeof electricity !== 'object') {
    errors.push('electricity data is required');
  } else {
    const units = Number(electricity.monthlyUnits);
    if (isNaN(units) || units < 0 || units > 100000) {
      errors.push('monthlyUnits must be a number between 0 and 100000');
    }
  }

  if (!food || typeof food !== 'object') {
    errors.push('food data is required');
  } else if (!VALID_DIET_TYPES.includes(food.dietType)) {
    errors.push(`dietType must be one of: ${VALID_DIET_TYPES.join(', ')}`);
  }

  if (!lifestyle || typeof lifestyle !== 'object') {
    errors.push('lifestyle data is required');
  } else {
    if (!VALID_SHOPPING.includes(lifestyle.shoppingFrequency)) {
      errors.push(`shoppingFrequency must be one of: ${VALID_SHOPPING.join(', ')}`);
    }
    if (!VALID_PLASTIC.includes(lifestyle.plasticConsumption)) {
      errors.push(`plasticConsumption must be one of: ${VALID_PLASTIC.join(', ')}`);
    }
  }

  return errors;
};

// ── Controllers ───────────────────────────────────────────────────────────────
const calculateCarbon = async (req, res) => {
  try {
    const validationErrors = validateCarbonInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    const { transport, electricity, food, lifestyle } = req.body;
    const result = calculateAll({ transport, electricity, food, lifestyle });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Carbon calculate error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Calculation failed. Please try again.' });
  }
};

const saveCarbon = async (req, res) => {
  try {
    const validationErrors = validateCarbonInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    const { transport, electricity, food, lifestyle } = req.body;
    const calculated = calculateAll({ transport, electricity, food, lifestyle });

    // Run DB operations in parallel for efficiency
    const [record] = await Promise.all([
      CarbonRecord.create({
        userId: req.user._id,
        ...calculated,
        inputData: { transport, electricity, food, lifestyle },
      }),
      User.findByIdAndUpdate(req.user._id, {
        sustainabilityScore: calculated.sustainabilityScore,
        totalEmission: calculated.totalEmission,
      }),
    ]);

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    logger.error(`Carbon save error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    // Sanitize pagination params
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) query.createdAt.$lte = end;
      }
    }

    const skip = (pageNum - 1) * limitNum;

    // Run count and find in parallel
    const [records, total] = await Promise.all([
      CarbonRecord.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      CarbonRecord.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error(`Get history error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    // Run both aggregations in parallel
    const [statsResult, monthlyData] = await Promise.all([
      CarbonRecord.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: null,
            avgTotal:      { $avg: '$totalEmission' },
            maxTotal:      { $max: '$totalEmission' },
            minTotal:      { $min: '$totalEmission' },
            avgTransport:  { $avg: '$transportEmission' },
            avgElectricity:{ $avg: '$electricityEmission' },
            avgFood:       { $avg: '$foodEmission' },
            avgLifestyle:  { $avg: '$lifestyleEmission' },
            count:         { $sum: 1 },
          },
        },
      ]),
      CarbonRecord.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            avgEmission: { $avg: '$totalEmission' },
            count:       { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({
      success: true,
      data: { summary: statsResult[0] || {}, monthly: monthlyData },
    });
  } catch (error) {
    logger.error(`Get stats error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { calculateCarbon, saveCarbon, getHistory, getStats };
