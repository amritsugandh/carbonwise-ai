const Prediction = require('../models/Prediction');
const CarbonRecord = require('../models/CarbonRecord');
const { generateForecast } = require('../utils/forecastEngine');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Reuse same key validation logic as aiController
const isValidGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith('YOUR_')) return false;
  return key.startsWith('AIzaSy') || key.startsWith('AQ.');
};

const generatePrediction = async (req, res) => {
  try {
    const historicalData = await CarbonRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    if (historicalData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No historical data found. Please calculate your carbon footprint first.',
      });
    }

    const forecast = generateForecast(historicalData);
    let aiInsights = [];

    // Only attempt Gemini if key is valid
    if (isValidGeminiKey()) {
      try {
        const key = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(key);
        const modelName = key.startsWith('AQ.') ? 'gemini-2.0-flash' : 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `Based on this carbon emission forecast:
Current: ${forecast.currentEmission} kg CO2/month
Next month: ${forecast.predictedNextMonth} kg CO2/month
Trend: ${forecast.trend.direction} (${forecast.trend.percentageChange}% change)
Risk: ${forecast.riskLevel.level}

Return ONLY a JSON array of exactly 3 insights, each under 30 words:
["insight1", "insight2", "insight3"]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          aiInsights = JSON.parse(match[0]);
        }
      } catch (aiError) {
        logger.warn(`AI prediction insights failed: ${aiError.message}`);
      }
    }

    // Always provide fallback insights if AI failed or not configured
    if (!aiInsights.length) {
      const trend = forecast.trend;
      const growth = Math.abs(trend.percentageChange).toFixed(1);
      aiInsights = [
        `Your emissions are ${trend.direction} — ${growth}% change from last month`,
        `Predicted next month: ${forecast.predictedNextMonth} kg CO₂ (${forecast.riskLevel.level} risk)`,
        `${trend.direction === 'increasing'
          ? 'Reducing weekly travel or switching to plant-based meals could reverse this trend'
          : trend.direction === 'decreasing'
          ? 'Great progress! Keep up your current habits to reach your reduction goals'
          : 'Emissions are stable. Set a new goal to push further reductions'}`,
      ];
    }

    const prediction = await Prediction.findOneAndUpdate(
      { userId: req.user._id },
      { ...forecast, aiInsights, userId: req.user._id },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: prediction });
  } catch (error) {
    logger.error(`Prediction error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLatestPrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'No prediction found. Generate one first.',
      });
    }
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPredictionHistory = async (req, res) => {
  try {
    const predictions = await Prediction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generatePrediction, getLatestPrediction, getPredictionHistory };
