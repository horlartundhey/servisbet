const BusinessProfile = require('../models/BusinessProfile');
const asyncHandler = require('./asyncHandler');

// Middleware to verify business ownership
const businessAuth = asyncHandler(async (req, res, next) => {
  const { businessId } = req.params;
  
  if (!businessId) {
    return res.status(400).json({
      success: false,
      error: 'Business ID is required'
    });
  }

  try {
    const business = await BusinessProfile.findById(businessId);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check if user owns this business
    if (business.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this business'
      });
    }

    // Add business to request object for use in controllers
    req.business = business;
    next();
    
  } catch (error) {
    console.error('Business auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during business verification'
    });
  }
});

module.exports = businessAuth;