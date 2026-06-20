const {
  calculateTransportEmission,
  calculateElectricityEmission,
  calculateFoodEmission,
  calculateLifestyleEmission,
  calculateSustainabilityScore,
  getScoreLevel,
  calculateAll,
  EMISSION_FACTORS
} = require('../../src/utils/carbonCalculator');

describe('Carbon Calculator Utility', () => {
  describe('calculateTransportEmission', () => {
    test('should calculate correct emissions for car_petrol', () => {
      const result = calculateTransportEmission({
        vehicleType: 'car_petrol',
        dailyDistance: 10,
        daysPerWeek: 5
      });
      // 0.21 * 10 * 5 * 4.33 = 45.465
      expect(result).toBeCloseTo(45.465);
    });

    test('should fallback to car_petrol if vehicleType is invalid', () => {
      const result = calculateTransportEmission({
        vehicleType: 'invalid_type',
        dailyDistance: 10,
        daysPerWeek: 5
      });
      expect(result).toBeCloseTo(45.465);
    });

    test('should use default daysPerWeek if not provided', () => {
      const result = calculateTransportEmission({
        vehicleType: 'car_electric',
        dailyDistance: 20
      });
      // 0.05 * 20 * 5 (default) * 4.33 = 21.65
      expect(result).toBeCloseTo(21.65);
    });
  });

  describe('calculateElectricityEmission', () => {
    test('should calculate correct emissions based on units', () => {
      const result = calculateElectricityEmission({ monthlyUnits: 100 });
      // 0.82 * 100 = 82
      expect(result).toBe(82);
    });
  });

  describe('calculateFoodEmission', () => {
    test('should calculate food emissions correctly for vegan diet', () => {
      const result = calculateFoodEmission({ dietType: 'vegan' });
      // 1.5 * 30 = 45
      expect(result).toBe(45);
    });

    test('should fallback to mixed diet if dietType is invalid', () => {
      const result = calculateFoodEmission({ dietType: 'unknown' });
      // 4.0 * 30 = 120
      expect(result).toBe(120);
    });
  });

  describe('calculateLifestyleEmission', () => {
    test('should calculate lifestyle emissions correctly', () => {
      const result = calculateLifestyleEmission({
        shoppingFrequency: 'sometimes',
        plasticConsumption: 'medium'
      });
      // 25 + 15 = 40
      expect(result).toBe(40);
    });

    test('should fallback to defaults if values are missing or invalid', () => {
      const result = calculateLifestyleEmission({});
      // 25 + 15 = 40
      expect(result).toBe(40);
    });
  });

  describe('calculateSustainabilityScore', () => {
    test('should return 100 for total emission <= 50', () => {
      expect(calculateSustainabilityScore(30)).toBe(100);
      expect(calculateSustainabilityScore(50)).toBe(100);
    });

    test('should return correct step scores', () => {
      expect(calculateSustainabilityScore(100)).toBe(90);
      expect(calculateSustainabilityScore(150)).toBe(80);
      expect(calculateSustainabilityScore(200)).toBe(70);
      expect(calculateSustainabilityScore(250)).toBe(60);
      expect(calculateSustainabilityScore(300)).toBe(50);
      expect(calculateSustainabilityScore(350)).toBe(40);
      expect(calculateSustainabilityScore(400)).toBe(30);
      expect(calculateSustainabilityScore(450)).toBe(20);
      expect(calculateSustainabilityScore(500)).toBe(10);
    });
  });

  describe('getScoreLevel', () => {
    test('should return Excellent for score >= 80', () => {
      expect(getScoreLevel(85)).toEqual({ level: 'Excellent', color: 'green' });
      expect(getScoreLevel(80)).toEqual({ level: 'Excellent', color: 'green' });
    });

    test('should return Good for score >= 60 and < 80', () => {
      expect(getScoreLevel(75)).toEqual({ level: 'Good', color: 'blue' });
      expect(getScoreLevel(60)).toEqual({ level: 'Good', color: 'blue' });
    });

    test('should return Average for score >= 40 and < 60', () => {
      expect(getScoreLevel(50)).toEqual({ level: 'Average', color: 'yellow' });
      expect(getScoreLevel(40)).toEqual({ level: 'Average', color: 'yellow' });
    });

    test('should return Needs Improvement for score < 40', () => {
      expect(getScoreLevel(30)).toEqual({ level: 'Needs Improvement', color: 'red' });
    });
  });

  describe('calculateAll', () => {
    test('should compute total carbon calculations and format results', () => {
      const formData = {
        transport: { vehicleType: 'car_petrol', dailyDistance: 10, daysPerWeek: 5 },
        electricity: { monthlyUnits: 100 },
        food: { dietType: 'vegan' },
        lifestyle: { shoppingFrequency: 'sometimes', plasticConsumption: 'medium' }
      };

      const result = calculateAll(formData);
      // Transport: 0.21 * 10 * 5 * 4.33 = 45.465 -> 45.47
      // Electricity: 0.82 * 100 = 82.00
      // Food: 1.5 * 30 = 45.00
      // Lifestyle: 25 + 15 = 40.00
      // Total: 45.465 + 82 + 45 + 40 = 212.465 -> 212.47
      // Sustainability score: total 212.47 is <= 250 -> 60 (Good)
      expect(result).toEqual({
        transportEmission: 45.47,
        electricityEmission: 82,
        foodEmission: 45,
        lifestyleEmission: 40,
        totalEmission: 212.47,
        sustainabilityScore: 60,
        scoreLevel: { level: 'Good', color: 'blue' }
      });
    });
  });
});
