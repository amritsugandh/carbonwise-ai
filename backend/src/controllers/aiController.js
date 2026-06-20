const { GoogleGenerativeAI } = require('@google/generative-ai');
const CarbonRecord = require('../models/CarbonRecord');
const { getChatResponse, getRecommendationsResponse } = require('../utils/localAI');
const logger = require('../utils/logger');

const isValidGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key.startsWith('YOUR_')) return false;
  // Support old standard keys (AIzaSy...) and new auth keys (AQ....)
  return key.startsWith('AIzaSy') || key.startsWith('AQ.');
};

// Memoize Gemini client — instantiate once per process, not per request
let _geminiClient = null;
const getGeminiClient = () => {
  if (_geminiClient) return _geminiClient;
  const key = process.env.GEMINI_API_KEY?.trim();
  const genAI = new GoogleGenerativeAI(key);
  const modelName = key.startsWith('AQ.') ? 'gemini-2.0-flash' : 'gemini-1.5-flash';
  _geminiClient = genAI.getGenerativeModel({ model: modelName });
  return _geminiClient;
};



// ── Recommendations ──────────────────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const { emissionData } = req.body;
    const user = req.user;

    const recentRecords = await CarbonRecord.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(3);

    // Use local AI if Gemini key not configured
    if (!isValidGeminiKey()) {
      logger.warn('Gemini key invalid — using local AI recommendations');
      const localResult = getRecommendationsResponse(emissionData);
      return res.json({ success: true, data: localResult, source: 'local' });
    }

    const prompt = `You are CarbonWise AI, an expert sustainability coach.

User Carbon Footprint Data:
- Transport: ${emissionData.transportEmission} kg CO2/month
- Electricity: ${emissionData.electricityEmission} kg CO2/month
- Food: ${emissionData.foodEmission} kg CO2/month
- Lifestyle: ${emissionData.lifestyleEmission} kg CO2/month
- Total: ${emissionData.totalEmission} kg CO2/month
- Sustainability Score: ${emissionData.sustainabilityScore}/100
- Records tracked: ${recentRecords.length}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-sentence summary of carbon status",
  "topIssue": "biggest emission source with kg amount",
  "tips": [
    {"title": "short title", "description": "actionable tip", "impact": "X kg CO2/month reduction", "category": "transport"},
    {"title": "short title", "description": "actionable tip", "impact": "X kg CO2/month reduction", "category": "electricity"},
    {"title": "short title", "description": "actionable tip", "impact": "X kg CO2/month reduction", "category": "food"},
    {"title": "short title", "description": "actionable tip", "impact": "X kg CO2/month reduction", "category": "lifestyle"},
    {"title": "short title", "description": "actionable tip", "impact": "X kg CO2/month reduction", "category": "transport"}
  ],
  "weeklyPlan": ["Mon-Tue action", "Wed-Thu action", "Fri-Sat action", "Sun action"],
  "offsetSuggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

    const model = getGeminiClient();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let recommendations;
    try {
      // Strip markdown code blocks if present
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch {
      recommendations = getRecommendationsResponse(emissionData);
    }

    res.json({ success: true, data: recommendations });
  } catch (error) {
    logger.error(`AI recommendations error: ${error.message}`);
    // Always fall back to local AI (quota exceeded, key invalid, network error)
    try {
      const localResult = getRecommendationsResponse(req.body.emissionData);
      return res.json({ success: true, data: localResult, source: 'local' });
    } catch (localErr) {
      res.status(500).json({ success: false, message: 'AI service unavailable' });
    }
  }
};

// ── Chat ─────────────────────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const user = req.user;
    const recentRecord = await CarbonRecord.findOne({ userId: user._id }).sort({ createdAt: -1 });

    // Use local AI if Gemini key not configured
    if (!isValidGeminiKey()) {
      logger.warn('Gemini key invalid — using local AI chat');
      const localResponse = getChatResponse(message, recentRecord);
      return res.json({
        success: true,
        data: { message: localResponse, timestamp: new Date(), source: 'local' },
      });
    }

    const systemContext = `You are CarbonWise AI Coach, a friendly and knowledgeable sustainability assistant.
You help users reduce their carbon footprint with specific, actionable advice.
${recentRecord
  ? `User's carbon data: Transport: ${recentRecord.transportEmission}kg, Electricity: ${recentRecord.electricityEmission}kg, Food: ${recentRecord.foodEmission}kg, Lifestyle: ${recentRecord.lifestyleEmission}kg, Total: ${recentRecord.totalEmission}kg CO2/month. Score: ${recentRecord.sustainabilityScore}/100`
  : 'No carbon data recorded yet for this user.'}

Rules:
- Keep responses under 200 words
- Be specific — use actual numbers from user data when relevant
- Use bullet points for lists
- Be encouraging and positive
- Always end with one actionable step they can take today`;

    const fullPrompt = `${systemContext}\n\nUser: ${message}\n\nCarbonWise AI:`;

    const model = getGeminiClient();
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    res.json({ success: true, data: { message: responseText, timestamp: new Date() } });
  } catch (error) {
    logger.error(`AI chat error: ${error.message}`);
    // Always fall back to local AI (quota, key invalid, network error)
    try {
      const recentRecord = await CarbonRecord.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      const localResponse = getChatResponse(req.body.message, recentRecord);
      const isQuota = error.message?.includes('429') || error.message?.includes('quota');
      return res.json({
        success: true,
        data: {
          message: isQuota
            ? `⚡ ${localResponse}\n\n*(Gemini quota exceeded — using local AI. Resets in ~1 min)*`
            : localResponse,
          timestamp: new Date(),
          source: 'local',
        },
      });
    } catch (localErr) {
      res.status(500).json({ success: false, message: 'AI service temporarily unavailable. Please try again.' });
    }
  }
};

module.exports = { getRecommendations, chat };
