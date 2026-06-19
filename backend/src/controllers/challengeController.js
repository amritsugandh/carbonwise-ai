const Challenge = require('../models/Challenge');
const User = require('../models/User');
const logger = require('../utils/logger');

// ── Badge definitions ─────────────────────────────────────────────────────────
const ACHIEVEMENT_BADGES = [
  {
    name: 'Eco Beginner',
    icon: '🌱',
    condition: (user, completedCount) => completedCount >= 1,
  },
  {
    name: 'Green Warrior',
    icon: '⚔️',
    condition: (user, completedCount) => completedCount >= 3,
  },
  {
    name: 'Carbon Saver',
    icon: '💚',
    condition: (user, completedCount) => user.ecoPoints >= 100,
  },
  {
    name: 'Eco Champion',
    icon: '🏆',
    condition: (user, completedCount) => completedCount >= 5,
  },
  {
    name: 'Sustainability Star',
    icon: '⭐',
    condition: (user, completedCount) => user.ecoPoints >= 300,
  },
  {
    name: 'Planet Protector',
    icon: '🌍',
    condition: (user, completedCount) => completedCount >= 8,
  },
];

// Check which new badges the user has earned and hasn't received yet
const getNewBadges = (user, completedCount) => {
  const existingBadgeNames = user.badges.map((b) => b.name);
  return ACHIEVEMENT_BADGES.filter(
    (badge) =>
      !existingBadgeNames.includes(badge.name) &&
      badge.condition(user, completedCount)
  );
};

// ── Get all challenges ────────────────────────────────────────────────────────
const getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true }).sort({ points: -1 });
    // Fetch fresh user data with populated completedChallenges
    const user = await User.findById(req.user._id);
    const completedIds = user.completedChallenges.map((id) => id.toString());

    const challengesWithStatus = challenges.map((c) => ({
      ...c.toObject(),
      isCompleted: completedIds.includes(c._id.toString()),
    }));

    res.json({ success: true, data: challengesWithStatus });
  } catch (error) {
    logger.error(`Get challenges error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Complete a challenge ──────────────────────────────────────────────────────
const completeChallenge = async (req, res) => {
  try {
    const { challengeId } = req.body;

    // Validate challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Fetch fresh user from DB (req.user may be stale)
    const user = await User.findById(req.user._id);

    // Check already completed — compare as strings to avoid ObjectId mismatch
    const alreadyCompleted = user.completedChallenges
      .map((id) => id.toString())
      .includes(challengeId.toString());

    if (alreadyCompleted) {
      return res.status(400).json({ success: false, message: 'Challenge already completed' });
    }

    // Calculate new points total
    const newPoints = (user.ecoPoints || 0) + challenge.points;
    const newCompletedCount = user.completedChallenges.length + 1;

    // Build update payload
    const updatePayload = {
      $push: { completedChallenges: challengeId },
      $inc: { ecoPoints: challenge.points },
    };

    // ── Award challenge-specific badge ───────────────────────────────────────
    const newBadges = [];

    // Badge for completing this specific challenge
    if (challenge.badge) {
      const alreadyHasBadge = user.badges.some((b) => b.name === challenge.badge);
      if (!alreadyHasBadge) {
        newBadges.push({ name: challenge.badge, icon: challenge.icon || '🏅', earnedAt: new Date() });
      }
    }

    // ── Award achievement milestone badges ───────────────────────────────────
    // Temporarily update user object for condition checking
    const tempUser = {
      ...user.toObject(),
      ecoPoints: newPoints,
      completedChallenges: [...user.completedChallenges, challengeId],
    };

    const achievementBadges = getNewBadges(tempUser, newCompletedCount);
    achievementBadges.forEach((badge) => {
      newBadges.push({ name: badge.name, icon: badge.icon, earnedAt: new Date() });
    });

    // Push all new badges
    if (newBadges.length > 0) {
      updatePayload.$push.badges = { $each: newBadges };
    }

    // Save to DB
    const updatedUser = await User.findByIdAndUpdate(user._id, updatePayload, { new: true });

    logger.info(`User ${user._id} completed challenge "${challenge.title}" — +${challenge.points} pts, ${newBadges.length} new badge(s)`);

    res.json({
      success: true,
      message: 'Challenge completed!',
      pointsEarned: challenge.points,
      totalPoints: updatedUser.ecoPoints,
      newBadges: newBadges,
      badgeCount: updatedUser.badges.length,
    });
  } catch (error) {
    logger.error(`Complete challenge error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Seed default challenges ───────────────────────────────────────────────────
const seedChallenges = async () => {
  try {
    const count = await Challenge.countDocuments();
    if (count > 0) return;

    const challenges = [
      {
        title: 'Bicycle for 3 Days',
        description: 'Use bicycle instead of motor vehicle for 3 days',
        points: 50,
        difficulty: 'easy',
        category: 'transport',
        duration: 3,
        emissionReduction: 5,
        icon: '🚲',
        badge: 'Cyclist',
      },
      {
        title: 'Avoid Single-Use Plastic',
        description: 'Go plastic-free for a week',
        points: 40,
        difficulty: 'easy',
        category: 'lifestyle',
        duration: 7,
        emissionReduction: 3,
        icon: '♻️',
        badge: 'Plastic-Free Hero',
      },
      {
        title: 'Save Electricity',
        description: 'Reduce electricity usage by 20% this month',
        points: 80,
        difficulty: 'medium',
        category: 'energy',
        duration: 30,
        emissionReduction: 15,
        icon: '💡',
        badge: 'Energy Saver',
      },
      {
        title: 'Plant 5 Trees',
        description: 'Plant 5 trees in your community',
        points: 100,
        difficulty: 'medium',
        category: 'nature',
        duration: 30,
        emissionReduction: 20,
        icon: '🌳',
        badge: 'Tree Planter',
      },
      {
        title: 'Public Transport Week',
        description: 'Use only public transport for a week',
        points: 70,
        difficulty: 'medium',
        category: 'transport',
        duration: 7,
        emissionReduction: 12,
        icon: '🚌',
        badge: 'Public Commuter',
      },
      {
        title: 'Go Vegetarian for 7 Days',
        description: 'Eat vegetarian meals for a week',
        points: 60,
        difficulty: 'easy',
        category: 'food',
        duration: 7,
        emissionReduction: 8,
        icon: '🥗',
        badge: 'Green Eater',
      },
      {
        title: 'Zero Waste Day',
        description: 'Produce zero waste for an entire day',
        points: 30,
        difficulty: 'easy',
        category: 'lifestyle',
        duration: 1,
        emissionReduction: 2,
        icon: '🗑️',
        badge: 'Zero Waster',
      },
      {
        title: 'Solar Energy Advocate',
        description: 'Research and share 3 solar energy solutions with friends',
        points: 40,
        difficulty: 'easy',
        category: 'energy',
        duration: 3,
        emissionReduction: 0,
        icon: '☀️',
        badge: 'Solar Advocate',
      },
    ];

    await Challenge.insertMany(challenges);
    logger.info('Challenges seeded successfully');
  } catch (err) {
    logger.warn(`Challenge seeding skipped: ${err.message}`);
  }
};

module.exports = { getChallenges, completeChallenge, seedChallenges };
