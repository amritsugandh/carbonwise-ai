const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    ecoPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    sustainabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedChallenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
      },
    ],
    badges: [
      {
        name: String,
        earnedAt: { type: Date, default: Date.now },
        icon: String,
      },
    ],
    totalEmission: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
