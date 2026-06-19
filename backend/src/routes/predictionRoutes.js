const express = require('express');
const router = express.Router();
const { generatePrediction, getLatestPrediction, getPredictionHistory } = require('../controllers/predictionController');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, generatePrediction);
router.get('/latest', authenticate, getLatestPrediction);
router.get('/history', authenticate, getPredictionHistory);

module.exports = router;
