const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportUrl: String,
    reportData: {
      type: mongoose.Schema.Types.Mixed,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    reportType: {
      type: String,
      enum: ['monthly', 'weekly', 'annual', 'custom'],
      default: 'monthly',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
