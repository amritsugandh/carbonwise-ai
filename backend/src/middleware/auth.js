const { getFirebaseAdmin } = require('../config/firebase');
const User = require('../models/User');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const admin = getFirebaseAdmin();

    // If Firebase not configured, reject with helpful message
    if (!admin) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service not configured. Set Firebase credentials in backend/.env',
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUID: decodedToken.uid });
    if (!user) {
      user = await User.create({
        firebaseUID: decodedToken.uid,
        email: decodedToken.email,
        username: decodedToken.name || decodedToken.email?.split('@')[0],
        avatar: decodedToken.picture || '',
      });
    }

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
