const express = require('express');
const router = express.Router();
const { getChallenges, completeChallenge } = require('../controllers/challengeController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getChallenges);
router.post('/complete', authenticate, completeChallenge);

module.exports = router;
