const Review = require('../models/Review');
const Business = require('../models/Business');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all reviews for a business
// @route   GET /api/review/business/:businessId
// @access  Public
const getBusinessReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minRating,
    maxRating
  } = req.query;

  const business = await Business.findById(req.params.businessId);
  
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  const reviews = await Review.getBusinessReviews(req.params.businessId, {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder,
    minRating: minRating ? parseInt(minRating) : undefined,
    maxRating: maxRating ? parseInt(maxRating) : undefined
  });

  const total = await Review.countDocuments({ 
    business: req.params.businessId, 
    status: 'published' 
  });

  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: reviews
  });
});

// @desc    Get user's reviews
// @route   GET /api/review/my-reviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.getUserReviews(req.user.id, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  const total = await Review.countDocuments({ 
    user: req.user.id, 
    status: { $ne: 'removed' }
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

// @desc    Create new review
// @route   POST /api/review
// @access  Private (User role)
const createReview = asyncHandler(async (req, res) => {
  const { business, rating, title, content, images, videos } = req.body;

  // Check if business exists
  const businessExists = await Business.findById(business);
  if (!businessExists) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Check if user already reviewed this business
  const existingReview = await Review.findOne({
    user: req.user.id,
    business: business
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this business. You can edit your existing review.'
    });
  }

  const review = await Review.create({
    business,
    user: req.user.id,
    rating,
    title,
    content: content || req.body.text, // Backward compatibility
    images: images || [],
    videos: videos || [],
    source: 'web'
  });

  await review.populate('user', 'name email');
  await review.populate('business', 'name slug');

  res.status(201).json({
    success: true,
    data: review,
    message: 'Review created successfully'
  });
});

// @desc    Update review
// @route   PUT /api/review/:id
// @access  Private (Review owner)
const updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Make sure user owns the review
  if (review.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  const { rating, title, content, images, videos } = req.body;

  review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      rating,
      title,
      content: content || req.body.text,
      images: images || review.images,
      videos: videos || review.videos,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'name email');

  res.status(200).json({
    success: true,
    data: review,
    message: 'Review updated successfully'
  });
});

// @desc    Delete review
// @route   DELETE /api/review/:id
// @access  Private (Review owner or Admin)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Make sure user owns the review or is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await review.remove();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Add business response to review
// @route   POST /api/review/:id/response
// @access  Private (Business owner or Admin)
const addBusinessResponse = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  const business = await Business.findById(review.business);
  
  // Check if user owns the business or is admin
  if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to respond to this review'
    });
  }

  const { content } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Response content is required'
    });
  }

  await review.addBusinessResponse(content, req.user.id);

  const updatedReview = await Review.findById(req.params.id)
    .populate('user', 'name email')
    .populate('businessResponse.respondedBy', 'name email');

  res.status(200).json({
    success: true,
    data: updatedReview,
    message: 'Business response added successfully'
  });
});

// @desc    Mark review as helpful
// @route   POST /api/review/:id/helpful
// @access  Private
const markReviewHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user already marked as helpful
  if (review.isMarkedHelpfulBy(req.user.id)) {
    return res.status(400).json({
      success: false,
      message: 'You have already marked this review as helpful'
    });
  }

  await review.markHelpful(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      helpfulCount: review.helpfulCount
    },
    message: 'Review marked as helpful'
  });
});

// @desc    Remove helpful mark from review
// @route   DELETE /api/review/:id/helpful
// @access  Private
const removeHelpfulMark = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.removeHelpful(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      helpfulCount: review.helpfulCount
    },
    message: 'Helpful mark removed'
  });
});

module.exports = {
  getBusinessReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
  addBusinessResponse,
  markReviewHelpful,
  removeHelpfulMark
};
