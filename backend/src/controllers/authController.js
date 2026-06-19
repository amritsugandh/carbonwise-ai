const User = require('../models/User');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const { firebaseUID, email, username, avatar } = req.body;

    // Input validation
    if (!firebaseUID || !email) {
      return res.status(400).json({ success: false, message: 'firebaseUID and email are required' });
    }

    // Sanitize email
    const cleanEmail = email.toLowerCase().trim();

    let user = await User.findOne({ firebaseUID });
    if (user) {
      // Update avatar/username if changed (e.g. Google profile updated)
      if (avatar && user.avatar !== avatar) {
        user = await User.findByIdAndUpdate(
          user._id,
          { avatar, username: username || user.username },
          { new: true }
        );
      }
      return res.status(200).json({ success: true, data: user, message: 'User already exists' });
    }

    user = await User.create({
      firebaseUID,
      email: cleanEmail,
      username: username || cleanEmail.split('@')[0],
      avatar: avatar || '',
    });
    res.status(201).json({ success: true, data: user, message: 'User registered successfully' });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    if (error.code === 11000) {
      // Duplicate key — user exists with this email but different firebaseUID (rare edge case)
      const existing = await User.findOne({ email: req.body.email?.toLowerCase() });
      if (existing) {
        return res.status(200).json({ success: true, data: existing });
      }
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const user = req.user;
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('completedChallenges');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const updates = {};
    if (username?.trim()) updates.username = username.trim();
    if (avatar) updates.avatar = avatar;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };
