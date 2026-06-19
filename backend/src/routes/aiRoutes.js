const express = require('express');
const router = express.Router();
const { getRecommendations, chat } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/recommendations', authenticate, aiLimiter, getRecommendations);
router.post('/chat', authenticate, aiLimiter, chat);

module.exports = router;
