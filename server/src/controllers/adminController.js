const User = require('../models/User');
const BusinessProfile = require('../models/BusinessProfile');
const Review = require('../models/Review');
const Flag = require('../models/Flag');
const Subscription = require('../models/Subscription');
const ReviewDispute = require('../models/ReviewDispute');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalBusinesses,
    totalReviews,
    pendingVerifications,
    activeDisputes,
    pendingDisputes,
    flaggedContent,
    recentUsers,
    recentBusinesses,
    flaggedReviews
  ] = await Promise.all([
    User.countDocuments(),
    BusinessProfile.countDocuments({ isActive: true }),
    Review.countDocuments(),
    BusinessProfile.countDocuments({ verificationStatus: 'pending', isActive: true }),
    ReviewDispute.countDocuments({ status: { $in: ['under_review', 'requires_info'] } }),
    ReviewDispute.countDocuments({ status: 'pending' }),
    Flag.countDocuments({ status: 'pending' }),
    User.find().sort('-createdAt').limit(5).select('firstName lastName email role createdAt'),
    BusinessProfile.find({ isActive: true }).sort('-createdAt').limit(5).select('businessName businessCategory owner createdAt verificationStatus').populate('owner', 'firstName lastName email'),
    Review.find({ 
      $or: [
        { status: 'flagged' },
        { reportCount: { $gte: 3 } },
        { flagged: true }
      ]
    }).limit(5).populate('user business', 'firstName lastName businessName')
  ]);

  // User statistics by role
  const usersByRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Business statistics by category
  const businessesByCategory = await BusinessProfile.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$businessCategory', count: { $sum: 1 } } }
  ]);

  // Business verification statistics
  const businessesByVerificationStatus = await BusinessProfile.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
  ]);

  // Reviews statistics by rating
  const reviewsByRating = await Review.aggregate([
    { $group: { _id: '$rating', count: { $sum: 1 } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalBusinesses,
        totalReviews,
        pendingVerifications,
        flaggedContent,
        activeDisputes,
        pendingDisputes
      },
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id || 'unknown'] = item.count;
        return acc;
      }, {}),
      businessesByCategory: businessesByCategory.reduce((acc, item) => {
        acc[item._id || 'uncategorized'] = item.count;
        return acc;
      }, {}),
      businessesByVerificationStatus: businessesByVerificationStatus.reduce((acc, item) => {
        acc[item._id || 'unverified'] = item.count;
        return acc;
      }, {}),
      reviewsByRating: reviewsByRating.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity: {
        recentUsers,
        recentBusinesses,
        flaggedReviews
      }
    }
  });
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;

  let query = {};
  
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-password');

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: total
    },
    data: users
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user,
    message: `User status updated to ${status}`
  });
});

// @desc    Get all businesses with pagination
// @route   GET /api/admin/businesses
// @access  Private (Admin only)
const getBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, status, search } = req.query;

  // Only show active businesses by default
  let query = { isActive: true };
  
  if (category) query.businessCategory = category;
  if (status) query.verificationStatus = status;
  if (search) {
    query.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { businessDescription: { $regex: search, $options: 'i' } }
    ];
  }

  const businesses = await BusinessProfile.find(query)
    .populate('owner', 'firstName lastName email')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await BusinessProfile.countDocuments(query);

  res.status(200).json({
    success: true,
    count: businesses.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: total
    },
    data: businesses
  });
});

// @desc    Update business status
// @route   PUT /api/admin/businesses/:id/status
// @access  Private (Admin only)
const updateBusinessStatus = asyncHandler(async (req, res) => {
  const { status, verificationStatus } = req.body;
  
  const updateData = {};
  if (status) updateData.isActive = status === 'active';
  if (verificationStatus) {
    updateData.verificationStatus = verificationStatus;
    updateData.isVerified = verificationStatus === 'approved';
  }

  const business = await BusinessProfile.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('owner', 'firstName lastName email');

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  res.status(200).json({
    success: true,
    data: business,
    message: 'Business status updated successfully'
  });
});

// @desc    Get all flagged reviews
// @route   GET /api/admin/reviews/flagged
// @access  Private (Admin only)
const getFlaggedReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const reviews = await Review.getFlaggedReviews({
    page: parseInt(page),
    limit: parseInt(limit)
  });

  const total = await Review.countDocuments({ 
    $or: [
      { status: 'flagged' },
      { reportCount: { $gte: 3 } },
      { flagged: true }
    ]
  });

  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: total
    },
    data: reviews
  });
});

// @desc    Moderate review (approve/reject/remove)
// @route   PUT /api/admin/reviews/:id/moderate
// @access  Private (Admin only)
const moderateReview = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // action: 'approve', 'reject', 'remove'
  
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  let message = '';

  switch (action) {
    case 'approve':
      await review.approve(req.user.id, reason);
      message = 'Review approved successfully';
      break;
    case 'remove':
      await review.remove(req.user.id, reason);
      message = 'Review removed successfully';
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation action'
      });
  }

  res.status(200).json({
    success: true,
    data: review,
    message
  });
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

  const [
    userGrowth,
    businessGrowth,
    reviewGrowth,
    topCategories,
    topBusinesses
  ] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      { $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]),
    BusinessProfile.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      { $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]),
    Review.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      { $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]),
    BusinessProfile.aggregate([
      { $group: { _id: '$businessCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    BusinessProfile.aggregate([
      { $sort: { averageRating: -1, totalReviews: -1 } },
      { $limit: 10 },
      { $project: { businessName: 1, businessCategory: 1, averageRating: 1, totalReviews: 1 } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      period: `${period} days`,
      growth: {
        users: userGrowth,
        businesses: businessGrowth,
        reviews: reviewGrowth
      },
      insights: {
        topCategories,
        topBusinesses
      }
    }
  });
});

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getBusinesses,
  updateBusinessStatus,
  getFlaggedReviews,
  moderateReview,
  getAnalytics
};
