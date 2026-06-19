const Report = require('../models/Report');
const CarbonRecord = require('../models/CarbonRecord');
const Goal = require('../models/Goal');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const logger = require('../utils/logger');

const generateReport = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const records = await CarbonRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    const goals = await Goal.find({ userId: req.user._id });
    const prediction = await Prediction.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

    const reportData = {
      user: {
        name: user.username,
        email: user.email,
        ecoPoints: user.ecoPoints,
        sustainabilityScore: user.sustainabilityScore,
      },
      summary: {
        totalRecords: records.length,
        avgEmission: records.length
          ? (records.reduce((sum, r) => sum + r.totalEmission, 0) / records.length).toFixed(2)
          : 0,
        latestEmission: records[0]?.totalEmission || 0,
        period: records.length
          ? `${new Date(records[records.length - 1].createdAt).toLocaleDateString()} - ${new Date(records[0].createdAt).toLocaleDateString()}`
          : 'No data',
      },
      breakdown: records[0]
        ? {
            transport: records[0].transportEmission,
            electricity: records[0].electricityEmission,
            food: records[0].foodEmission,
            lifestyle: records[0].lifestyleEmission,
          }
        : {},
      goals: goals.map((g) => ({
        title: g.title,
        target: g.targetEmission,
        progress: g.progress,
        status: g.status,
      })),
      prediction: prediction
        ? {
            nextMonth: prediction.predictedNextMonth,
            trend: prediction.trend,
            riskLevel: prediction.riskLevel,
            insights: prediction.aiInsights,
          }
        : null,
      generatedAt: new Date(),
    };

    const report = await Report.create({
      userId: req.user._id,
      reportData,
    });

    res.json({ success: true, data: { reportId: report._id, reportData } });
  } catch (error) {
    logger.error(`Report generation error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateReport, downloadReport, getReports };
