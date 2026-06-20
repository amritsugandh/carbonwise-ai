const { generateForecast } = require('../../src/utils/forecastEngine');

describe('Forecast Engine Utility', () => {
  test('should return null for empty or missing historical data', () => {
    expect(generateForecast(null)).toBeNull();
    expect(generateForecast([])).toBeNull();
  });

  test('should forecast with 1 historical record (5% growth assumption)', () => {
    const historicalData = [
      { totalEmission: 100, createdAt: new Date('2026-05-01') }
    ];

    const result = generateForecast(historicalData);
    // Predicted next month: 100 * 1.05 = 105
    // Trend: direction: stable, percentageChange: 0
    // predictedNextWeek: 105 / 4.33 = 24.25
    // predictedThreeMonths: 105 * (1 + 0)^2 = 105
    // confidenceScore: 60 + 1 * 5 = 65
    // riskLevel: (105-100)/100 = 5% growth -> Low
    expect(result).toEqual(expect.objectContaining({
      currentEmission: 100,
      predictedNextWeek: 24.25,
      predictedNextMonth: 105,
      predictedThreeMonths: 105,
      confidenceScore: 65,
      trend: { direction: 'stable', percentageChange: 0 },
      riskLevel: { level: 'Low', color: 'yellow' }
    }));
  });

  test('should forecast with 2 historical records (60/40 weighted)', () => {
    const historicalData = [
      { totalEmission: 100, createdAt: new Date('2026-05-01') },
      { totalEmission: 80, createdAt: new Date('2026-04-01') } // previous month (b.createdAt < a.createdAt)
    ];

    const result = generateForecast(historicalData);
    // Sorted by date desc: emissions[0] = 100 (May), emissions[1] = 80 (Apr)
    // Predicted: 100 * 0.6 + 80 * 0.4 = 92
    // Trend: percentageChange = ((100 - 80) / 80) * 100 = 25% (increasing)
    // predictedThreeMonths: 92 * (1 + 0.25)^2 = 92 * 1.5625 = 143.75
    // confidenceScore: 60 + 2 * 5 = 70
    // riskLevel: growth = ((92 - 100) / 100) * 100 = -8% -> Minimal
    expect(result).toEqual(expect.objectContaining({
      currentEmission: 100,
      predictedNextMonth: 92,
      predictedThreeMonths: 143.75,
      confidenceScore: 70,
      trend: { direction: 'increasing', percentageChange: 25 },
      riskLevel: { level: 'Minimal', color: 'green' }
    }));
  });

  test('should forecast with 3 or more historical records (50/30/20 weighted)', () => {
    const historicalData = [
      { totalEmission: 100, createdAt: new Date('2026-05-01') },
      { totalEmission: 90, createdAt: new Date('2026-04-01') },
      { totalEmission: 80, createdAt: new Date('2026-03-01') }
    ];

    const result = generateForecast(historicalData);
    // Sorted by date desc: May: 100, Apr: 90, Mar: 80
    // Predicted: 100 * 0.5 + 90 * 0.3 + 80 * 0.2 = 50 + 27 + 16 = 93
    // Trend: percentageChange = ((100 - 90) / 90) * 100 = 11.11% (increasing)
    // predictedThreeMonths: 93 * (1 + 0.1111)^2 = 93 * 1.2345 = 114.81
    // confidenceScore: 60 + 3 * 5 = 75
    // riskLevel: growth = ((93 - 100) / 100) * 100 = -7% -> Minimal
    expect(result).toEqual(expect.objectContaining({
      currentEmission: 100,
      predictedNextMonth: 93,
      predictedThreeMonths: 114.81, // parseFloat with fixed 2 yields 114.81
      confidenceScore: 75,
      trend: { direction: 'increasing', percentageChange: 11.11 },
      riskLevel: { level: 'Minimal', color: 'green' }
    }));
  });

  test('should detect decreasing trend and high risk level', () => {
    const historicalData = [
      { totalEmission: 100, createdAt: new Date('2026-05-01') },
      { totalEmission: 200, createdAt: new Date('2026-04-01') }
    ];

    const result = generateForecast(historicalData);
    // May: 100, Apr: 200
    // Predicted: 100 * 0.6 + 200 * 0.4 = 140
    // Trend: percentageChange = ((100 - 200) / 200) * 100 = -50% (decreasing)
    // Risk: growth = ((140 - 100) / 100) * 100 = 40% (High risk)
    expect(result.trend.direction).toBe('decreasing');
    expect(result.riskLevel.level).toBe('High');
  });

  test('should detect stable trend (under 5%) and moderate risk level', () => {
    const historicalData = [
      { totalEmission: 100, createdAt: new Date('2026-05-01') },
      { totalEmission: 102, createdAt: new Date('2026-04-01') }
    ];

    const result = generateForecast(historicalData);
    // May: 100, Apr: 102
    // Predicted: 100 * 0.6 + 102 * 0.4 = 100.8
    // Trend: percentageChange = ((100 - 102) / 102) * 100 = -1.96% (stable)
    // Risk: growth = ((100.8 - 100) / 100) * 100 = 0.8% (Low risk)
    expect(result.trend.direction).toBe('stable');
    expect(result.riskLevel.level).toBe('Low');
  });

  test('should detect moderate risk level', () => {
    const historicalData = [
      { totalEmission: 100, createdAt: new Date('2026-05-01') },
      { totalEmission: 130, createdAt: new Date('2026-04-01') }
    ];

    const result = generateForecast(historicalData);
    // May: 100, Apr: 130
    // Predicted: 100 * 0.6 + 130 * 0.4 = 112
    // Risk: growth = ((112 - 100) / 100) * 100 = 12% (Moderate risk)
    expect(result.riskLevel.level).toBe('Moderate');
  });
});
