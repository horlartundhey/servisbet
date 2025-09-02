const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Get all subscriptions (Admin only)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.paymentStatus = status;
    
    const subscriptions = await Subscription.find(query)
      .populate('business', 'name email category')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Subscription.countDocuments(query);
    
    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create subscription (Business only)
router.post('/', verifyToken, requireRole('business'), async (req, res) => {
  try {
    const { business, plan, endDate } = req.body;
    const subscription = new Subscription({ business, plan, endDate });
    await subscription.save();
    res.status(201).json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get subscriptions for a business (Business owner or Admin)
router.get('/business/:businessId', verifyToken, requireRole('business', 'admin'), async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Business owners can only access their own business subscriptions
    // Admins can access any business subscriptions
    if (req.user.role === 'business') {
      // Check if the business belongs to the requesting user
      const Business = require('../models/Business');
      const business = await Business.findOne({ _id: businessId, owner: req.user._id });
      if (!business) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied. You can only view subscriptions for your own business.' 
        });
      }
    }
    
    const subs = await Subscription.find({ business: businessId })
      .populate('business', 'name email category')
      .sort('-createdAt');
      
    res.json({
      success: true,
      data: subs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
