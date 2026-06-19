const mongoose = require('mongoose');

const carbonRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transportEmission: { type: Number, required: true, min: 0 },
    electricityEmission: { type: Number, required: true, min: 0 },
    foodEmission: { type: Number, required: true, min: 0 },
    lifestyleEmission: { type: Number, required: true, min: 0 },
    totalEmission: { type: Number, required: true, min: 0 },
    sustainabilityScore: { type: Number, min: 0, max: 100 },
    inputData: {
      transport: {
        vehicleType: String,
        dailyDistance: Number,
        daysPerWeek: Number,
      },
      electricity: {
        monthlyUnits: Number,
      },
      food: {
        dietType: String,
      },
      lifestyle: {
        shoppingFrequency: String,
        plasticConsumption: String,
      },
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

carbonRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CarbonRecord', carbonRecordSchema);
