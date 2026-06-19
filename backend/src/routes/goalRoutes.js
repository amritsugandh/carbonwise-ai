const express = require('express');
const router = express.Router();
const { createGoal, updateGoal, getGoals, deleteGoal } = require('../controllers/goalController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createGoal);
router.get('/', authenticate, getGoals);
router.put('/:id', authenticate, updateGoal);
router.delete('/:id', authenticate, deleteGoal);

module.exports = router;
