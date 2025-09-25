const Review = require('../models/Review');
const BusinessProfile = require('../models/BusinessProfile');
const User = require('../models/User');
const emailVerificationService = require('../services/emailVerificationService');
const reviewNotificationService = require('../services/reviewNotificationService');
const socketService = require('../services/socketService');
const asyncHandler = require('../middlewares/asyncHandler');

// Helper function to get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// Helper function to check and send low rating alert
const checkAndSendLowRatingAlert = async (review, business) => {
  try {
    // Calculate business average rating
    const reviewStats = await Review.aggregate([
      { 
        $match: { 
          business: business._id, 
          isVerified: true,
          $or: [{ isAnonymous: { $ne: true } }, { isAnonymous: true }] // Include all verified reviews
        } 
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (reviewStats.length > 0) {
      const averageRating = reviewStats[0].averageRating;
      const totalReviews = reviewStats[0].totalReviews;

      console.log(`Business ${business.name} rating: ${averageRating.toFixed(2)} (${totalReviews} reviews)`);

      // Send alert if average rating is below 4.0 and this is a low rating (3 or below)
      if (averageRating < 4.0 && review.rating <= 3) {
        // Get business owner details
        const businessOwner = await User.findById(business.owner);
        
        if (businessOwner) {
          console.log(`🚨 Low rating alert for ${business.name} - Current rating: ${averageRating.toFixed(2)}`);
          
          // Send email alert
          await emailVerificationService.sendLowRatingAlert({
            businessOwner,
            business,
            averageRating: averageRating.toFixed(2),
            totalReviews,
            newReview: {
              rating: review.rating,
              content: review.content,
              reviewerName: review.anonymousReviewer?.name || 'Anonymous',
              createdAt: review.createdAt
            }
          });

          // Send real-time socket notification
          socketService.sendLowRatingAlert(
            business._id,
            business,
            averageRating.toFixed(2),
            review
          );
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendLowRatingAlert:', error);
    throw error;
  }
};

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

  const business = await BusinessProfile.findById(req.params.businessId);
  
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

// @desc    Create new review (authenticated user)
// @route   POST /api/review
// @access  Private (User role)
const createReview = asyncHandler(async (req, res) => {
  const { business, rating, title, content, images, videos } = req.body;

  // Handle uploaded files
  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    uploadedImages = req.files.map(file => file.path); // Extract just the Cloudinary URLs
  }

  // Process provided images - handle both string URLs and objects
  let processedImages = [];
  if (images && Array.isArray(images)) {
    processedImages = images.map(img => {
      if (typeof img === 'string') {
        return img; // Already a URL string
      } else if (typeof img === 'object' && img.url) {
        return img.url; // Extract URL from object
      }
      return null;
    }).filter(Boolean);
  } else if (typeof images === 'string') {
    // Handle case where images might be sent as stringified JSON
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        processedImages = parsed.map(img => img.url || img).filter(Boolean);
      }
    } catch (e) {
      // If parsing fails, treat as single URL
      processedImages = [images];
    }
  }

  // Merge uploaded images with processed image URLs
  const allImages = [...uploadedImages, ...processedImages];

  // Check if business exists
  const businessExists = await BusinessProfile.findById(business);
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
    images: allImages,
    videos: videos || [],
    source: 'web',
    isAnonymous: false,
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent']
  });

  await review.populate('user', 'name email');
  await review.populate('business', 'name slug');

  // Send notifications asynchronously
  setImmediate(async () => {
    try {
      const business = await BusinessProfile.findById(review.business);
      if (business) {
        // Send email notifications
        await reviewNotificationService.sendNewReviewNotification(review, business);
        await reviewNotificationService.sendAdminReviewNotification(review, business);
        
        // Send real-time socket notification to business
        socketService.sendNewReviewNotification(business._id, review, business);
      }
    } catch (error) {
      console.error('Error sending review notifications:', error);
    }
  });

  res.status(201).json({
    success: true,
    data: review,
    message: 'Review created successfully'
  });
});

// @desc    Create anonymous review (no authentication required)
// @route   POST /api/review/anonymous
// @access  Public
const createAnonymousReview = asyncHandler(async (req, res) => {
  const { 
    business,
    businessId, 
    rating, 
    title, 
    content, 
    images, 
    videos,
    reviewerName,
    reviewerEmail
  } = req.body;

  // Use businessId if provided, otherwise use business
  const targetBusiness = businessId || business;

  // Handle uploaded files
  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    uploadedImages = req.files.map(file => file.path); // Extract just the Cloudinary URLs
  }

  // Process provided images - handle both string URLs and objects
  let processedImages = [];
  if (images && Array.isArray(images)) {
    processedImages = images.map(img => {
      if (typeof img === 'string') {
        return img; // Already a URL string
      } else if (typeof img === 'object' && img.url) {
        return img.url; // Extract URL from object
      }
      return null;
    }).filter(Boolean);
  } else if (typeof images === 'string') {
    // Handle case where images might be sent as stringified JSON
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        processedImages = parsed.map(img => img.url || img).filter(Boolean);
      }
    } catch (e) {
      // If parsing fails, treat as single URL
      processedImages = [images];
    }
  }

  // Merge uploaded images with processed image URLs
  const allImages = [...uploadedImages, ...processedImages];

  // Validation
  if (!targetBusiness || !rating || !content || !reviewerName || !reviewerEmail) {
    return res.status(400).json({
      success: false,
      message: 'Business ID, rating, content, reviewer name, and email are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(reviewerEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // Check if business exists
  const businessExists = await BusinessProfile.findById(targetBusiness);
  if (!businessExists) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  const clientIP = getClientIP(req);
  const deviceFingerprint = req.headers['x-device-fingerprint'] || 
                           `${req.headers['user-agent']}_${clientIP}`;

  // Check for duplicate reviews (same email, IP, or device within timeframe)
  const isDuplicate = await Review.checkDuplicateAnonymousReview(
    reviewerEmail, 
    targetBusiness, 
    clientIP,
    deviceFingerprint
  );

  if (isDuplicate) {
    return res.status(409).json({
      success: false,
      message: 'A review from this email or location already exists for this business. Please wait 24 hours between reviews.'
    });
  }

  // Rate limiting - check recent submissions from this IP
  const recentReviews = await Review.getReviewsByIP(clientIP, 24);
  if (recentReviews.length >= 3) {
    return res.status(429).json({
      success: false,
      message: 'Too many reviews from this location. Please try again later.'
    });
  }

  // Create the anonymous review
  const review = await Review.create({
    business: targetBusiness,
    rating,
    title,
    content,
    images: allImages,
    videos: videos || [],
    isAnonymous: true,
    anonymousReviewer: {
      name: reviewerName,
      email: reviewerEmail,
      isVerified: false
    },
    status: 'pending', // Will be published after email verification
    source: 'web',
    ipAddress: clientIP,
    deviceFingerprint,
    userAgent: req.headers['user-agent'],
    submissionAttempts: 1
  });

  // Calculate and set spam score
  await review.calculateSpamScore();
  await review.save();

  // If spam score is too high, flag for manual review
  if (review.isSpam) {
    review.status = 'flagged';
    review.spamReasons = ['High spam score detected'];
    await review.save();

    return res.status(202).json({
      success: true,
      message: 'Your review has been submitted for moderation. You will receive an email notification once it is approved.',
      data: {
        reviewId: review._id,
        status: 'pending_moderation'
      }
    });
  }

  // Send email verification
  try {
    await emailVerificationService.sendAnonymousReviewVerification(
      review, 
      review.anonymousReviewer.verificationToken,
      businessExists
    );

    res.status(202).json({
      success: true,
      message: 'Review submitted successfully! Please check your email to verify and publish your review.',
      data: {
        reviewId: review._id,
        verificationRequired: true,
        reviewerEmail: reviewerEmail,
        businessName: businessExists.name
      }
    });
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    
    // If email fails, still save the review but inform user
    res.status(202).json({
      success: true,
      message: 'Review submitted, but we encountered an issue sending the verification email. Please contact support.',
      data: {
        reviewId: review._id,
        emailIssue: true
      }
    });
  }
});

// @desc    Verify anonymous review email
// @route   GET /api/review/verify/:token
// @access  Public
const verifyAnonymousReview = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  // Find the review with this token
  const review = await Review.findOne({
    'anonymousReviewer.verificationToken': token,
    isAnonymous: true,
    'anonymousReviewer.isVerified': false
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  try {
    // Verify the review
    await review.verifyAnonymousEmail(token);

    // Get business details for confirmation email
    const business = await BusinessProfile.findById(review.business);
    
    // Send confirmation email
    if (business) {
      try {
        await emailVerificationService.sendReviewPublishedConfirmation(review, business);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    // Check business rating and send low rating alert if needed
    if (business) {
      try {
        await checkAndSendLowRatingAlert(review, business);
      } catch (alertError) {
        console.error('Failed to send low rating alert:', alertError);
      }

      // Send general review notifications asynchronously
      setImmediate(async () => {
        try {
          // Send email notifications
          await reviewNotificationService.sendNewReviewNotification(review, business);
          await reviewNotificationService.sendAdminReviewNotification(review, business);
          
          // Send real-time socket notification to business
          socketService.sendNewReviewNotification(business._id, review, business);
        } catch (notificationError) {
          console.error('Failed to send review notifications:', notificationError);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your review is now published.',
      data: {
        reviewId: review._id,
        businessName: business?.name,
        reviewerName: review.anonymousReviewer.name
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Resend email verification
// @route   POST /api/review/resend-email-verification
// @access  Public
const resendEmailVerification = asyncHandler(async (req, res) => {
  const { reviewId } = req.body;

  if (!reviewId) {
    return res.status(400).json({
      success: false,
      message: 'Review ID is required'
    });
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  if (!review.isAnonymous || review.anonymousReviewer.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'This review does not require email verification'
    });
  }

  // Get business details
  const business = await BusinessProfile.findById(review.business);
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  try {
    // Generate new verification token
    const crypto = require('crypto');
    review.anonymousReviewer.verificationToken = crypto.randomBytes(32).toString('hex');
    review.anonymousReviewer.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await review.save();

    // Send new verification email
    await emailVerificationService.sendAnonymousReviewVerification(
      review, 
      review.anonymousReviewer.verificationToken,
      business
    );

    res.status(200).json({
      success: true,
      message: `New verification email sent to ${review.anonymousReviewer.email}`,
      data: {
        reviewId: review._id,
        email: review.anonymousReviewer.email
      }
    });
  } catch (error) {
    console.error('Failed to resend verification email:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resend verification email'
    });
  }
});

// @desc    Get pending verification reviews (for admin)
// @route   GET /api/review/pending-verification
// @access  Private (Admin)
const getPendingVerificationReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const reviews = await Review.getPendingVerificationReviews({
    page: parseInt(page),
    limit: parseInt(limit)
  });

  const total = await Review.countDocuments({
    isAnonymous: true,
    'anonymousReviewer.isVerified': false,
    status: 'pending',
    'anonymousReviewer.verificationTokenExpires': { $gte: new Date() }
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

  const business = await BusinessProfile.findById(review.business);
  
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

// @desc    Get all recent reviews
// @route   GET /api/reviews
// @access  Public
const getAllReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    rating,
    businessId
  } = req.query;

  // Build query
  let query = { isVerified: true }; // Only show verified reviews
  
  if (rating) {
    query.rating = rating;
  }
  
  if (businessId) {
    query.business = businessId;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const reviews = await Review.find(query)
      .populate({
        path: 'business',
        select: 'name category businessSlug images'
      })
      .populate({
        path: 'user',
        select: 'firstName lastName avatar'
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limitNum);

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalReviews,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      averageRating: Number(averageRating.toFixed(1))
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reviews'
    });
  }
});

module.exports = {
  getAllReviews,
  getBusinessReviews,
  getMyReviews,
  createReview,
  createAnonymousReview,
  verifyAnonymousReview,
  resendEmailVerification,
  getPendingVerificationReviews,
  updateReview,
  deleteReview,
  addBusinessResponse,
  markReviewHelpful,
  removeHelpfulMark
};
