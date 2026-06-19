// Emission factors (kg CO2 per unit)
const EMISSION_FACTORS = {
  transport: {
    car_petrol: 0.21, // kg CO2 per km
    car_diesel: 0.17,
    car_electric: 0.05,
    motorcycle: 0.11,
    bus: 0.089,
    train: 0.041,
    plane: 0.255,
    bicycle: 0,
    walking: 0,
  },
  electricity: {
    // kg CO2 per kWh (India grid average)
    default: 0.82,
  },
  food: {
    vegan: 1.5, // kg CO2 per day
    vegetarian: 2.5,
    mixed: 4.0,
    meat_heavy: 7.0,
  },
  lifestyle: {
    shopping: {
      rarely: 10, // kg CO2 per month
      sometimes: 25,
      often: 50,
      very_often: 80,
    },
    plastic: {
      low: 5,
      medium: 15,
      high: 30,
      very_high: 50,
    },
  },
};

const calculateTransportEmission = (data) => {
  const { vehicleType, dailyDistance, daysPerWeek = 5 } = data;
  const factor = EMISSION_FACTORS.transport[vehicleType] || EMISSION_FACTORS.transport.car_petrol;
  // Monthly emission = daily distance * days per week * ~4.33 weeks
  return factor * dailyDistance * daysPerWeek * 4.33;
};

const calculateElectricityEmission = (data) => {
  const { monthlyUnits } = data;
  return EMISSION_FACTORS.electricity.default * monthlyUnits;
};

const calculateFoodEmission = (data) => {
  const { dietType } = data;
  const factor = EMISSION_FACTORS.food[dietType] || EMISSION_FACTORS.food.mixed;
  return factor * 30; // monthly
};

const calculateLifestyleEmission = (data) => {
  const { shoppingFrequency, plasticConsumption } = data;
  const shoppingEmission = EMISSION_FACTORS.lifestyle.shopping[shoppingFrequency] || 25;
  const plasticEmission = EMISSION_FACTORS.lifestyle.plastic[plasticConsumption] || 15;
  return shoppingEmission + plasticEmission;
};

const calculateSustainabilityScore = (totalEmission) => {
  // Average global carbon footprint ~333 kg CO2/month
  // Score inversely related to emissions
  if (totalEmission <= 50) return 100;
  if (totalEmission <= 100) return 90;
  if (totalEmission <= 150) return 80;
  if (totalEmission <= 200) return 70;
  if (totalEmission <= 250) return 60;
  if (totalEmission <= 300) return 50;
  if (totalEmission <= 350) return 40;
  if (totalEmission <= 400) return 30;
  if (totalEmission <= 450) return 20;
  return 10;
};

const getScoreLevel = (score) => {
  if (score >= 80) return { level: 'Excellent', color: 'green' };
  if (score >= 60) return { level: 'Good', color: 'blue' };
  if (score >= 40) return { level: 'Average', color: 'yellow' };
  return { level: 'Needs Improvement', color: 'red' };
};

const calculateAll = (formData) => {
  const transportEmission = calculateTransportEmission(formData.transport);
  const electricityEmission = calculateElectricityEmission(formData.electricity);
  const foodEmission = calculateFoodEmission(formData.food);
  const lifestyleEmission = calculateLifestyleEmission(formData.lifestyle);
  const totalEmission = transportEmission + electricityEmission + foodEmission + lifestyleEmission;
  const sustainabilityScore = calculateSustainabilityScore(totalEmission);

  return {
    transportEmission: parseFloat(transportEmission.toFixed(2)),
    electricityEmission: parseFloat(electricityEmission.toFixed(2)),
    foodEmission: parseFloat(foodEmission.toFixed(2)),
    lifestyleEmission: parseFloat(lifestyleEmission.toFixed(2)),
    totalEmission: parseFloat(totalEmission.toFixed(2)),
    sustainabilityScore,
    scoreLevel: getScoreLevel(sustainabilityScore),
  };
};

module.exports = {
  calculateAll,
  calculateTransportEmission,
  calculateElectricityEmission,
  calculateFoodEmission,
  calculateLifestyleEmission,
  calculateSustainabilityScore,
  getScoreLevel,
  EMISSION_FACTORS,
};
