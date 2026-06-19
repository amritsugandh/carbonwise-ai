const Goal = require('../models/Goal');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const calcProgress = (current, target) => {
  if (!current || current <= 0) return 0;
  const p = Math.round(((current - target) / current) * 100);
  return Math.min(100, Math.max(0, isNaN(p) ? 0 : p));
};

const createGoal = async (req, res) => {
  try {
    const { title, description, targetEmission, currentEmission, deadline, category } = req.body;

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Goal title is required' });
    }
    const target = parseFloat(targetEmission);
    if (isNaN(target) || target < 0) {
      return res.status(400).json({ success: false, message: 'Valid targetEmission is required' });
    }

    const current = parseFloat(currentEmission) || req.user.totalEmission || 0;
    const progress = calcProgress(current, target);

    const goal = await Goal.create({
      userId: req.user._id,
      title: title.trim(),
      description: description?.trim(),
      targetEmission: target,
      currentEmission: current,
      progress,
      status: current <= target ? 'completed' : 'active',
      deadline: deadline ? new Date(deadline) : undefined,
      category: category || 'overall',
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    logger.error(`Create goal error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const updates = {};
    const { title, description, targetEmission, currentEmission, deadline, category, status } = req.body;

    if (title?.trim()) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (category) updates.category = category;
    if (status) updates.status = status;
    if (deadline) updates.deadline = new Date(deadline);

    const target = parseFloat(targetEmission);
    const current = parseFloat(currentEmission);

    if (!isNaN(target)) updates.targetEmission = target;
    if (!isNaN(current)) updates.currentEmission = current;

    // Recalculate progress if emission values change
    if (!isNaN(target) || !isNaN(current)) {
      const existingGoal = await Goal.findOne({ _id: id, userId: req.user._id });
      if (existingGoal) {
        const newCurrent = !isNaN(current) ? current : existingGoal.currentEmission;
        const newTarget = !isNaN(target) ? target : existingGoal.targetEmission;
        updates.progress = calcProgress(newCurrent, newTarget);
        if (newCurrent <= newTarget) updates.status = 'completed';
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, data: goal });
  } catch (error) {
    logger.error(`Update goal error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }
    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createGoal, updateGoal, getGoals, deleteGoal };
