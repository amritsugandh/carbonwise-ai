/**
 * Carbon Emission Forecast Engine
 * Implements weighted average and trend analysis for predictions
 */

const generateForecast = (historicalData) => {
  if (!historicalData || historicalData.length === 0) {
    return null;
  }

  // Sort by date descending
  const sorted = [...historicalData].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const emissions = sorted.map((r) => r.totalEmission);

  // Weighted average forecast (MVP approach)
  let predictedNextMonth;
  if (emissions.length >= 3) {
    predictedNextMonth =
      emissions[0] * 0.5 + emissions[1] * 0.3 + emissions[2] * 0.2;
  } else if (emissions.length === 2) {
    predictedNextMonth = emissions[0] * 0.6 + emissions[1] * 0.4;
  } else {
    predictedNextMonth = emissions[0] * 1.05; // 5% growth assumption
  }

  // Trend analysis
  const trend = calculateTrend(emissions);

  // Next week prediction (proportional to monthly)
  const predictedNextWeek = predictedNextMonth / 4.33;

  // 3-month prediction
  const trendFactor = 1 + trend.percentageChange / 100;
  const predictedThreeMonths = predictedNextMonth * Math.pow(trendFactor, 2);

  // Confidence score based on data availability
  const confidenceScore = Math.min(95, 60 + historicalData.length * 5);

  // Risk level
  const riskLevel = calculateRiskLevel(predictedNextMonth, emissions[0]);

  return {
    currentEmission: parseFloat(emissions[0].toFixed(2)),
    predictedNextWeek: parseFloat(predictedNextWeek.toFixed(2)),
    predictedNextMonth: parseFloat(predictedNextMonth.toFixed(2)),
    predictedThreeMonths: parseFloat(predictedThreeMonths.toFixed(2)),
    confidenceScore,
    trend: {
      direction: trend.direction,
      percentageChange: parseFloat(trend.percentageChange.toFixed(2)),
    },
    riskLevel,
    chartData: generateChartData(sorted, predictedNextMonth, trendFactor),
  };
};

const calculateTrend = (emissions) => {
  if (emissions.length < 2) {
    return { direction: 'stable', percentageChange: 0 };
  }

  const recent = emissions[0];
  const previous = emissions[1];
  const percentageChange = ((recent - previous) / previous) * 100;

  let direction;
  if (percentageChange > 5) direction = 'increasing';
  else if (percentageChange < -5) direction = 'decreasing';
  else direction = 'stable';

  return { direction, percentageChange };
};

const calculateRiskLevel = (predicted, current) => {
  const growth = ((predicted - current) / current) * 100;
  if (growth > 20) return { level: 'High', color: 'red' };
  if (growth > 10) return { level: 'Moderate', color: 'orange' };
  if (growth > 0) return { level: 'Low', color: 'yellow' };
  return { level: 'Minimal', color: 'green' };
};

const generateChartData = (historicalData, nextMonthPrediction, trendFactor) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  // Historical chart points
  const historical = historicalData.slice(0, 6).reverse().map((record) => {
    const date = new Date(record.createdAt);
    return {
      month: months[date.getMonth()],
      emission: record.totalEmission,
      type: 'historical',
    };
  });

  // Predicted points
  const predictions = [];
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    predictions.push({
      month: months[futureDate.getMonth()],
      emission: parseFloat((nextMonthPrediction * Math.pow(trendFactor, i - 1)).toFixed(2)),
      type: 'predicted',
    });
  }

  return [...historical, ...predictions];
};

module.exports = { generateForecast };
