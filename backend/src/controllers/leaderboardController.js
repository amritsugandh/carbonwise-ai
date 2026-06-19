const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 20 } = req.query;

    const users = await User.find({}, {
      username: 1,
      email: 1,
      avatar: 1,
      ecoPoints: 1,
      sustainabilityScore: 1,
      totalEmission: 1,
    })
      .sort({ ecoPoints: -1, sustainabilityScore: -1 })
      .limit(parseInt(limit));

    const ranked = users.map((user, index) => ({
      rank: index + 1,
      ...user.toObject(),
    }));

    // Find current user's rank
    const userRank = ranked.findIndex((u) => u._id.toString() === req.user._id.toString()) + 1;

    res.json({
      success: true,
      data: {
        leaderboard: ranked,
        userRank: userRank || null,
        period,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLeaderboard };
