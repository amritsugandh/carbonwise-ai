const express = require('express');
const router = express.Router();
const { calculateCarbon, saveCarbon, getHistory, getStats } = require('../controllers/carbonController');
const { authenticate } = require('../middleware/auth');

router.post('/calculate', calculateCarbon);        // No auth needed — pure math
router.post('/save', authenticate, saveCarbon);
router.get('/history', authenticate, getHistory);
router.get('/stats', authenticate, getStats);

module.exports = router;
