const { getChatResponse, getRecommendationsResponse } = require('../../src/utils/localAI');

describe('Local AI Fallback Utility', () => {
  const dummyCarbonData = {
    totalEmission: 300,
    transportEmission: 120,
    electricityEmission: 80,
    foodEmission: 60,
    lifestyleEmission: 40,
    sustainabilityScore: 50
  };

  describe('getChatResponse', () => {
    test('should respond to hello/hi greetings', () => {
      const response = getChatResponse('Hello there!', dummyCarbonData);
      expect(response).toContain("CarbonWise AI Coach");
      expect(response).toContain("300.0 kg CO₂/month");
    });

    test('should respond to reduction keywords', () => {
      const response = getChatResponse('How can I reduce my carbon footprint?', dummyCarbonData);
      expect(response).toContain("Transport (120.0 kg)");
      expect(response).toContain("Electricity (80.0 kg)");
      expect(response).toContain("Food (60.0 kg)");
    });

    test('should respond to electricity energy keywords', () => {
      const response = getChatResponse('Save electricity tips', dummyCarbonData);
      expect(response).toContain("LED");
      expect(response).toContain("Unplug chargers");
    });

    test('should respond to transport keywords', () => {
      const response = getChatResponse('What about car emissions?', dummyCarbonData);
      expect(response).toContain("public transport");
      expect(response).toContain("Carpool");
    });

    test('should respond to diet/food keywords', () => {
      const response = getChatResponse('vegan diet advice', dummyCarbonData);
      expect(response).toContain("vegan");
      expect(response).toContain("vegetarian");
    });

    test('should respond to offset/tree keywords', () => {
      const response = getChatResponse('how to offset emissions?', dummyCarbonData);
      expect(response).toContain("Plant trees");
      expect(response).toContain("carbon credits");
    });

    test('should respond to score/sustainability keywords', () => {
      const response = getChatResponse('what is my score status?', dummyCarbonData);
      expect(response).toContain("50/100");
    });

    test('should respond to weekly plan keywords', () => {
      const response = getChatResponse('give me a weekly plan', dummyCarbonData);
      expect(response).toContain("7-Day Eco Plan");
      expect(response).toContain("Mon:");
    });

    test('should fallback to default message for unknown queries', () => {
      const response = getChatResponse('random question', dummyCarbonData);
      expect(response).toContain("Based on your data");
    });
  });

  describe('getRecommendationsResponse', () => {
    test('should construct detailed recommendations and weekly plan based on input emissions', () => {
      const response = getRecommendationsResponse(dummyCarbonData);
      expect(response.summary).toContain("300.0 kg");
      expect(response.topIssue).toContain("Transport (120.0 kg CO₂/month");
      expect(response.tips).toHaveLength(5);
      expect(response.weeklyPlan).toHaveLength(4);
      expect(response.offsetSuggestions).toHaveLength(3);
    });
  });
});
