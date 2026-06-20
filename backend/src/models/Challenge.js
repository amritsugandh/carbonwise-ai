const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    category: {
      type: String,
      enum: ['transport', 'energy', 'food', 'lifestyle', 'nature'],
      required: true,
    },
    duration: {
      type: Number, // days
      default: 7,
    },
    emissionReduction: {
      type: Number, // estimated kg CO2
      default: 0,
    },
    icon: String,
    badge: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

challengeSchema.index({ isActive: 1, points: -1 });

module.exports = mongoose.model('Challenge', challengeSchema);
