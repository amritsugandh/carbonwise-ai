const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentEmission: { type: Number, required: true },
    predictedNextWeek: { type: Number, required: true },
    predictedNextMonth: { type: Number, required: true },
    predictedThreeMonths: { type: Number, required: true },
    confidenceScore: { type: Number, min: 0, max: 100 },
    trend: {
      direction: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
      },
      percentageChange: Number,
    },
    riskLevel: {
      level: String,
      color: String,
    },
    chartData: [
      {
        month: String,
        emission: Number,
        type: { type: String, enum: ['historical', 'predicted'] },
      },
    ],
    aiInsights: [String],
  },
  {
    timestamps: true,
  }
);

predictionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
