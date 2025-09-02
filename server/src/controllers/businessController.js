const Business = require('../models/Business');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all businesses
// @route   GET /api/business
// @access  Public
const getBusinesses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    city,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    latitude,
    longitude,
    radius = 10000
  } = req.query;

  let query = { status: 'active' };
  let sort = {};

  // Build query
  if (category) {
    query.category = category;
  }

  if (city) {
    query['address.city'] = new RegExp(city, 'i');
  }

  // Location-based search
  if (latitude && longitude) {
    query['address.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(radius)
      }
    };
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
    sort.score = { $meta: 'textScore' };
  }

  // Sorting
  sort[sortBy] = order === 'asc' ? 1 : -1;

  const businesses = await Business.find(query)
    .populate('owner', 'name email')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Business.countDocuments(query);

  res.status(200).json({
    success: true,
    count: businesses.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: businesses
  });
});

// @desc    Get single business
// @route   GET /api/business/:id
// @access  Public
const getBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('subscription');

  if (!business || business.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  res.status(200).json({
    success: true,
    data: business
  });
});

// @desc    Create new business
// @route   POST /api/business
// @access  Private (Business users only)
const createBusiness = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.owner = req.user.id;

  const business = await Business.create(req.body);

  res.status(201).json({
    success: true,
    data: business,
    message: 'Business created successfully'
  });
});

// @desc    Update business
// @route   PUT /api/business/:id
// @access  Private (Owner or Admin)
const updateBusiness = asyncHandler(async (req, res) => {
  let business = await Business.findById(req.params.id);

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Make sure user is business owner or admin
  if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this business'
    });
  }

  business = await Business.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: business,
    message: 'Business updated successfully'
  });
});

// @desc    Delete business
// @route   DELETE /api/business/:id
// @access  Private (Owner or Admin)
const deleteBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Make sure user is business owner or admin
  if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this business'
    });
  }

  await business.remove();

  res.status(200).json({
    success: true,
    message: 'Business deleted successfully'
  });
});

// @desc    Get businesses owned by user
// @route   GET /api/business/my-businesses
// @access  Private (Business users only)
const getMyBusinesses = asyncHandler(async (req, res) => {
  const businesses = await Business.find({ owner: req.user.id })
    .populate('subscription')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: businesses.length,
    data: businesses
  });
});

// @desc    Get business analytics
// @route   GET /api/business/:id/analytics
// @access  Private (Owner or Admin)
const getBusinessAnalytics = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Make sure user is business owner or admin
  if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view analytics for this business'
    });
  }

  // Get review statistics
  const Review = require('../models/Review');
  
  const reviewStats = await Review.aggregate([
    { $match: { business: business._id } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingBreakdown: {
          $push: '$rating'
        }
      }
    }
  ]);

  // Calculate rating breakdown
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (reviewStats[0]) {
    reviewStats[0].ratingBreakdown.forEach(rating => {
      ratingCounts[rating]++;
    });
  }

  // Get recent reviews
  const recentReviews = await Review.find({ business: business._id })
    .populate('user', 'name')
    .sort('-createdAt')
    .limit(5);

  const analytics = {
    business: {
      name: business.name,
      totalReviews: reviewStats[0]?.totalReviews || 0,
      averageRating: reviewStats[0]?.averageRating || 0,
      profileCompletion: business.profileCompletion
    },
    ratingBreakdown: ratingCounts,
    recentReviews
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});

module.exports = {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusinesses,
  getBusinessAnalytics
};
