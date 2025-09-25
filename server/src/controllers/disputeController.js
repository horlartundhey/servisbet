const ReviewDispute = require('../models/ReviewDispute');
const Review = require('../models/Review');
const BusinessProfile = require('../models/BusinessProfile');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Submit a review dispute
// @route   POST /api/disputes
// @access  Private (Business owners only)
const submitDispute = asyncHandler(async (req, res) => {
  const {
    reviewId,
    businessId,
    disputeType,
    reason,
    additionalInfo,
    businessContext,
    evidence
  } = req.body;

  // Verify the business belongs to the user
  const business = await BusinessProfile.findOne({
    _id: businessId,
    owner: req.user.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found or not authorized'
    });
  }

  // Verify the review exists and belongs to the business
  const review = await Review.findOne({
    _id: reviewId,
    business: businessId
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if a dispute already exists for this review
  const existingDispute = await ReviewDispute.findOne({
    review: reviewId,
    status: { $nin: ['resolved', 'rejected'] }
  });

  if (existingDispute) {
    return res.status(400).json({
      success: false,
      message: 'A dispute already exists for this review'
    });
  }

  // Create the dispute
  const dispute = await ReviewDispute.create({
    review: reviewId,
    business: businessId,
    submittedBy: req.user.id,
    disputeType,
    reason,
    additionalInfo,
    businessContext,
    evidence: evidence || []
  });

  await dispute.populate('review', 'rating comment user createdAt');
  await dispute.populate('business', 'businessName');

  res.status(201).json({
    success: true,
    data: dispute,
    message: 'Review dispute submitted successfully'
  });
});

// @desc    Get business disputes
// @route   GET /api/disputes/my-disputes/:businessId?
// @access  Private (Business owners only)
const getMyDisputes = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  let query = { submittedBy: req.user.id };

  // If specific business requested, verify ownership
  if (businessId) {
    const business = await BusinessProfile.findOne({
      _id: businessId,
      owner: req.user.id,
      isActive: true
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found or not authorized'
      });
    }

    query.business = businessId;
  } else {
    // Get all disputes for user's businesses
    const userBusinesses = await BusinessProfile.find({
      owner: req.user.id,
      isActive: true
    }).select('_id');

    query.business = { $in: userBusinesses.map(b => b._id) };
  }

  if (status) {
    query.status = status;
  }

  const disputes = await ReviewDispute.find(query)
    .populate('review', 'rating comment user createdAt')
    .populate('business', 'businessName')
    .populate('adminResponse.reviewedBy', 'firstName lastName')
    .sort({ submittedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await ReviewDispute.countDocuments(query);

  res.status(200).json({
    success: true,
    count: disputes.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: disputes
  });
});

// @desc    Get single dispute details
// @route   GET /api/disputes/:id
// @access  Private (Business owners and admins)
const getDispute = asyncHandler(async (req, res) => {
  const dispute = await ReviewDispute.findById(req.params.id)
    .populate('review', 'rating comment user createdAt')
    .populate('business', 'businessName')
    .populate('submittedBy', 'firstName lastName email')
    .populate('adminResponse.reviewedBy', 'firstName lastName')
    .populate('communications.fromUser', 'firstName lastName');

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  // Check authorization (business owner or admin)
  if (req.user.role !== 'admin' && dispute.submittedBy.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this dispute'
    });
  }

  res.status(200).json({
    success: true,
    data: dispute
  });
});

// @desc    Add communication to dispute
// @route   POST /api/disputes/:id/communicate
// @access  Private (Business owners and admins)
const addCommunication = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  const dispute = await ReviewDispute.findById(req.params.id);

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  // Check authorization
  if (req.user.role !== 'admin' && dispute.submittedBy.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to communicate on this dispute'
    });
  }

  const from = req.user.role === 'admin' ? 'admin' : 'business';
  await dispute.addCommunication(from, req.user.id, message.trim());

  await dispute.populate('communications.fromUser', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: dispute,
    message: 'Communication added successfully'
  });
});

// @desc    Update dispute evidence
// @route   PUT /api/disputes/:id/evidence
// @access  Private (Business owners only)
const updateEvidence = asyncHandler(async (req, res) => {
  const { evidence } = req.body;

  const dispute = await ReviewDispute.findById(req.params.id);

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  // Only business owner can update evidence
  if (dispute.submittedBy.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this dispute'
    });
  }

  // Only allow updates if dispute is pending or requires info
  if (!['pending', 'requires_info'].includes(dispute.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update evidence for disputes in current status'
    });
  }

  dispute.evidence = evidence || [];
  await dispute.save();

  res.status(200).json({
    success: true,
    data: dispute,
    message: 'Evidence updated successfully'
  });
});

// Admin-only endpoints

// @desc    Get all disputes (admin only)
// @route   GET /api/disputes/admin/all
// @access  Private (Admin only)
const getAllDisputes = asyncHandler(async (req, res) => {
  const { 
    status, 
    priority, 
    disputeType, 
    page = 1, 
    limit = 20,
    sortBy = 'submittedAt',
    order = 'desc'
  } = req.query;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (disputeType) {
    query.disputeType = disputeType;
  }

  const sort = {};
  sort[sortBy] = order === 'asc' ? 1 : -1;

  const disputes = await ReviewDispute.find(query)
    .populate('business', 'businessName businessEmail')
    .populate('review', 'rating comment user')
    .populate('submittedBy', 'firstName lastName email')
    .populate('adminResponse.reviewedBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await ReviewDispute.countDocuments(query);

  // Get status counts for dashboard
  const statusCounts = await ReviewDispute.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: disputes.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    statusCounts: statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    data: disputes
  });
});

// @desc    Review dispute (admin only)
// @route   PUT /api/disputes/:id/review
// @access  Private (Admin only)
const reviewDispute = asyncHandler(async (req, res) => {
  const { status, decision, notes, internalNotes, actionTaken } = req.body;

  const dispute = await ReviewDispute.findById(req.params.id)
    .populate('review')
    .populate('business', 'businessName businessEmail')
    .populate('submittedBy', 'firstName lastName email');

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  // Update dispute with admin decision
  await dispute.updateStatus(status, req.user.id, decision, notes);

  if (internalNotes) {
    dispute.adminResponse.internalNotes = internalNotes;
  }

  if (status === 'resolved' && actionTaken) {
    dispute.resolution = dispute.resolution || {};
    dispute.resolution.actionTaken = actionTaken;
    dispute.resolution.businessNotified = true;
    dispute.resolution.businessNotifiedAt = new Date();
  }

  await dispute.save();

  // If review should be removed/hidden, update the review
  if (decision === 'remove_review' && dispute.review) {
    await Review.findByIdAndUpdate(dispute.review._id, { 
      status: 'removed',
      moderationReason: 'Removed due to dispute resolution'
    });
  } else if (decision === 'hide_review' && dispute.review) {
    await Review.findByIdAndUpdate(dispute.review._id, { 
      status: 'hidden',
      moderationReason: 'Hidden due to dispute resolution'
    });
  } else if (decision === 'flag_review' && dispute.review) {
    await Review.findByIdAndUpdate(dispute.review._id, { 
      isFlagged: true,
      moderationReason: 'Flagged due to dispute resolution'
    });
  }

  await dispute.populate('adminResponse.reviewedBy', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: dispute,
    message: 'Dispute reviewed successfully'
  });
});

// @desc    Escalate dispute (admin only)
// @route   PUT /api/disputes/:id/escalate
// @access  Private (Admin only)
const escalateDispute = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const dispute = await ReviewDispute.findById(req.params.id);

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  await dispute.escalate(reason);

  res.status(200).json({
    success: true,
    data: dispute,
    message: 'Dispute escalated successfully'
  });
});

module.exports = {
  submitDispute,
  getMyDisputes,
  getDispute,
  addCommunication,
  updateEvidence,
  getAllDisputes,
  reviewDispute,
  escalateDispute
};