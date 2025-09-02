const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Core Review Data
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5,
    index: -1
  },
  title: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  content: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Media
  images: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return v.length <= 5; // Max 5 images
      },
      message: 'Maximum 5 images allowed per review'
    }
  }], // Cloudinary URLs
  videos: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return v.length <= 2; // Max 2 videos
      },
      message: 'Maximum 2 videos allowed per review'
    }
  }], // Cloudinary URLs
  
  // Relationships
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  business: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true
  },
  
  // Moderation & Status
  status: { 
    type: String, 
    enum: ['published', 'pending', 'flagged', 'removed', 'draft'], 
    default: 'published',
    index: true
  },
  moderationNotes: { 
    type: String,
    trim: true
  },
  moderatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // admin user
  },
  moderatedAt: { 
    type: Date 
  },
  
  // Interaction Metrics
  helpfulCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  reportCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  viewCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Users who marked this review as helpful
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Business Response
  businessResponse: {
    content: { 
      type: String,
      trim: true,
      maxlength: 1000
    },
    respondedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' // business owner/manager
    },
    respondedAt: { 
      type: Date 
    }
  },
  
  // Verification & Trust
  isVerifiedPurchase: { 
    type: Boolean, 
    default: false 
  },
  verificationSource: {
    type: String,
    enum: ['email', 'receipt', 'booking', 'manual'],
  },
  
  // Review Quality Metrics
  qualityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Sentiment Analysis (can be populated by AI service)
  sentiment: {
    score: { 
      type: Number, // -1 to 1 scale
      min: -1,
      max: 1
    },
    label: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    keywords: [String] // extracted keywords
  },
  
  // Edit History
  editHistory: [{
    editedAt: { type: Date, default: Date.now },
    previousContent: String,
    previousRating: Number,
    reason: String
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  },
  ipAddress: String, // For spam detection
  userAgent: String,
  
  // Legacy support - handled by virtual fields
  // text: { 
  //   type: String,
  //   // Virtual getter/setter to maintain backward compatibility
  // },
  // media: [String], // Legacy field - maps to images array - handled by virtual
  flagged: { 
    type: Boolean, 
    default: false 
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: -1
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ INDEXES for Performance
reviewSchema.index({ user: 1 });
reviewSchema.index({ business: 1 });
reviewSchema.index({ business: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ qualityScore: -1 });

// Compound indexes for common queries
reviewSchema.index({ business: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, status: 1, createdAt: -1 });

// Text search index for review content
reviewSchema.index({
  title: 'text',
  content: 'text',
  'sentiment.keywords': 'text'
}, {
  weights: {
    title: 10,
    content: 5,
    'sentiment.keywords': 3
  },
  name: 'review_text_search'
});

// ✅ VIRTUAL FIELDS
// Backward compatibility for 'text' field
reviewSchema.virtual('text').get(function() {
  return this.content;
}).set(function(v) {
  this.content = v;
});

// Backward compatibility for 'media' field
reviewSchema.virtual('media').get(function() {
  return [...(this.images || []), ...(this.videos || [])];
}).set(function(v) {
  // Split media array into images and videos based on file extension
  this.images = v.filter(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
  this.videos = v.filter(url => /\.(mp4|mov|avi|webm)$/i.test(url));
});

// Display rating with stars
reviewSchema.virtual('ratingStars').get(function() {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Time since review was posted
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Check if review has media
reviewSchema.virtual('hasMedia').get(function() {
  return (this.images && this.images.length > 0) || (this.videos && this.videos.length > 0);
});

// Check if review has business response
reviewSchema.virtual('hasBusinessResponse').get(function() {
  return this.businessResponse && this.businessResponse.content;
});

// ✅ MIDDLEWARE
// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Track edit history
reviewSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('rating')) {
    if (!this.isNew && (this.isModified('content') || this.isModified('rating'))) {
      this.editHistory.push({
        editedAt: new Date(),
        previousContent: this.content,
        previousRating: this.rating,
        reason: 'User edit'
      });
    }
  }
  next();
});

// Update business rating after review changes
reviewSchema.post('save', async function(doc) {
  const Business = mongoose.model('Business');
  const business = await Business.findById(doc.business);
  if (business && typeof business.updateRatingStats === 'function') {
    await business.updateRatingStats();
  }
});

// Update business rating after review deletion
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Business = mongoose.model('Business');
    const business = await Business.findById(doc.business);
    if (business && typeof business.updateRatingStats === 'function') {
      await business.updateRatingStats();
    }
  }
});

// ✅ STATIC METHODS
// Get reviews for a business with pagination
reviewSchema.statics.getBusinessReviews = function(businessId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status = 'published',
    minRating,
    maxRating
  } = options;

  const query = { 
    business: businessId,
    status: status
  };

  if (minRating) query.rating = { ...query.rating, $gte: minRating };
  if (maxRating) query.rating = { ...query.rating, $lte: maxRating };

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(query)
    .populate('user', 'firstName lastName avatar')
    .populate('businessResponse.respondedBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Get user's reviews
reviewSchema.statics.getUserReviews = function(userId, options = {}) {
  const { page = 1, limit = 10, status = 'published' } = options;

  return this.find({ user: userId, status: status })
    .populate('business', 'name logo slug category')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Get flagged reviews for moderation
reviewSchema.statics.getFlaggedReviews = function(options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({ 
    $or: [
      { status: 'flagged' },
      { reportCount: { $gte: 3 } },
      { flagged: true }
    ]
  })
    .populate('user', 'firstName lastName email')
    .populate('business', 'name slug')
    .populate('moderatedBy', 'firstName lastName')
    .sort({ reportCount: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Search reviews by text
reviewSchema.statics.searchReviews = function(query, options = {}) {
  const { businessId, minRating, maxRating } = options;
  
  const searchQuery = {
    $text: { $search: query },
    status: 'published'
  };
  
  if (businessId) searchQuery.business = businessId;
  if (minRating) searchQuery.rating = { ...searchQuery.rating, $gte: minRating };
  if (maxRating) searchQuery.rating = { ...searchQuery.rating, $lte: maxRating };
  
  return this.find(searchQuery, { 
    score: { $meta: 'textScore' } 
  })
    .populate('user', 'firstName lastName avatar')
    .populate('business', 'name slug logo')
    .sort({ 
      score: { $meta: 'textScore' },
      createdAt: -1
    });
};

// ✅ INSTANCE METHODS
// Mark review as helpful by a user
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId);
    this.helpfulCount = this.helpfulBy.length;
  }
  return this.save();
};

// Remove helpful mark by a user
reviewSchema.methods.removeHelpful = function(userId) {
  this.helpfulBy.pull(userId);
  this.helpfulCount = this.helpfulBy.length;
  return this.save();
};

// Check if user marked this review as helpful
reviewSchema.methods.isMarkedHelpfulBy = function(userId) {
  return this.helpfulBy.includes(userId);
};

// Add business response
reviewSchema.methods.addBusinessResponse = function(content, respondedBy) {
  this.businessResponse = {
    content: content,
    respondedBy: respondedBy,
    respondedAt: new Date()
  };
  return this.save();
};

// Flag review for moderation
reviewSchema.methods.flagForModeration = function(reason, moderatorNotes) {
  this.status = 'flagged';
  this.flagged = true;
  this.reportCount += 1;
  if (moderatorNotes) this.moderationNotes = moderatorNotes;
  return this.save();
};

// Approve flagged review
reviewSchema.methods.approve = function(moderatorId, notes) {
  this.status = 'published';
  this.flagged = false;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  if (notes) this.moderationNotes = notes;
  return this.save();
};

// Remove review (soft delete)
reviewSchema.methods.remove = function(moderatorId, reason) {
  this.status = 'removed';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNotes = reason;
  return this.save();
};

// Calculate quality score based on various factors
reviewSchema.methods.calculateQualityScore = function() {
  let score = 50; // Base score
  
  // Length factor (longer reviews generally better)
  if (this.content.length > 100) score += 10;
  if (this.content.length > 300) score += 10;
  
  // Media factor
  if (this.hasMedia) score += 15;
  
  // Helpful factor
  if (this.helpfulCount > 0) score += Math.min(this.helpfulCount * 5, 20);
  
  // Verified purchase factor
  if (this.isVerifiedPurchase) score += 15;
  
  // Deduct for reports
  score -= this.reportCount * 10;
  
  // Ensure score is within bounds
  this.qualityScore = Math.max(0, Math.min(100, score));
  
  return this.qualityScore;
};

module.exports = mongoose.model('Review', reviewSchema);