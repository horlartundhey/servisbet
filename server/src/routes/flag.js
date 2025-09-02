const express = require('express');
const router = express.Router();
const Flag = require('../models/Flag');
const { verifyToken } = require('../middlewares/auth');

// Flag a review
router.post('/', verifyToken, async (req, res) => {
  try {
    const { review, reason } = req.body;
    const flag = new Flag({ review, flaggedBy: req.user.id, reason });
    await flag.save();
    res.status(201).json(flag);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all flags (Admin only)
router.get('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  try {
    const flags = await Flag.find().populate('review flaggedBy');
    res.json(flags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
