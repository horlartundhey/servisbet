const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Core Review Data
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
    // Removed index: -1 to avoid duplication with separate index definition
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
    required: false // Made optional to support anonymous reviews
    // Removed index: true to avoid duplication with separate index definition
  },
  
  // Anonymous Review Fields
  isAnonymous: {
    type: Boolean,
    default: false,
    index: true
  },
  anonymousReviewer: {
    name: {
      type: String,
      required: function() { return this.isAnonymous; },
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      required: function() { return this.isAnonymous; },
      trim: true,
      lowercase: true,
      validate: {
        validator: function(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String
    },
    verificationTokenExpires: {
      type: Date
    }
  },
  
  business: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true
    // Removed index: true to avoid duplication with separate index definition
  },
  
  // Moderation & Status
  status: { 
    type: String, 
    enum: ['published', 'pending', 'flagged', 'removed', 'draft'], 
    default: 'published'
    // Removed index: true to avoid duplication with separate index definition
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
  ipAddress: {
    type: String,
    index: true // For spam detection and rate limiting
  },
  userAgent: String,
  
  // Spam Prevention
  spamScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isSpam: {
    type: Boolean,
    default: false,
    index: true
  },
  spamReasons: [String], // Array of detected spam indicators
  
  // Rate Limiting Fields
  submissionAttempts: {
    type: Number,
    default: 1
  },
  lastSubmissionIP: String,
  
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
reviewSchema.index({ isAnonymous: 1 });
reviewSchema.index({ ipAddress: 1 });
reviewSchema.index({ isSpam: 1 });
// Removed standalone createdAt index to avoid duplication with compound indexes
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ qualityScore: -1 });

// Anonymous review specific indexes
reviewSchema.index({ 'anonymousReviewer.email': 1, business: 1 }); // Prevent duplicate reviews per email per business
reviewSchema.index({ ipAddress: 1, createdAt: -1 }); // Rate limiting by IP
reviewSchema.index({ isAnonymous: 1, 'anonymousReviewer.isVerified': 1 }); // Filter verified anonymous reviews

// Compound indexes for common queries
reviewSchema.index({ business: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, status: 1, createdAt: -1 });
reviewSchema.index({ business: 1, isAnonymous: 1, status: 1, createdAt: -1 });
reviewSchema.index({ business: 1, rating: -1, createdAt: -1 }); // For rating-based filtering

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

// Get reviewer display info (anonymous or authenticated)
reviewSchema.virtual('reviewerInfo').get(function() {
  if (this.isAnonymous) {
    return {
      name: this.anonymousReviewer.name,
      email: this.anonymousReviewer.email,
      isVerified: this.anonymousReviewer.isVerified,
      type: 'anonymous'
    };
  }
  if (this.user) {
    return {
      name: `${this.user.firstName} ${this.user.lastName}`,
      email: this.user.email,
      avatar: this.user.avatar,
      isVerified: true,
      type: 'authenticated'
    };
  }
  return {
    name: 'Unknown User',
    type: 'unknown'
  };
});

// Check if review needs email verification
reviewSchema.virtual('needsVerification').get(function() {
  return this.isAnonymous && !this.anonymousReviewer.isVerified && this.status === 'pending';
});

// ✅ MIDDLEWARE
// Validate anonymous vs authenticated review requirements
reviewSchema.pre('validate', function(next) {
  // For anonymous reviews, ensure all required anonymous fields are present
  if (this.isAnonymous) {
    if (!this.anonymousReviewer.name || !this.anonymousReviewer.email) {
      return next(new Error('Anonymous reviews require name and email'));
    }
    // Anonymous reviews don't need user
    this.user = undefined;
  } else {
    // For authenticated reviews, ensure user is present
    if (!this.user) {
      return next(new Error('Authenticated reviews require a user'));
    }
    // Clear anonymous fields for authenticated reviews
    this.anonymousReviewer = undefined;
  }
  next();
});

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate verification token for anonymous reviews
reviewSchema.pre('save', function(next) {
  if (this.isAnonymous && this.isNew && !this.anonymousReviewer.verificationToken) {
    const crypto = require('crypto');
    this.anonymousReviewer.verificationToken = crypto.randomBytes(32).toString('hex');
    this.anonymousReviewer.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    this.anonymousReviewer.isVerified = false;
    this.status = 'pending'; // Anonymous reviews start as pending until verified
  }
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
    maxRating,
    includeAnonymous = true
  } = options;

  const query = { 
    business: businessId,
    status: status
  };

  if (minRating) query.rating = { ...query.rating, $gte: minRating };
  if (maxRating) query.rating = { ...query.rating, $lte: maxRating };
  if (!includeAnonymous) query.isAnonymous = false;

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(query)
    .populate('user', 'firstName lastName avatar')
    .populate('businessResponse.respondedBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Check for duplicate anonymous reviews
reviewSchema.statics.checkDuplicateAnonymousReview = async function(email, businessId, ipAddress, timeWindow = 24) {
  const timeLimit = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
  
  const duplicates = await this.find({
    $or: [
      { 'anonymousReviewer.email': email, business: businessId },
      { ipAddress: ipAddress, business: businessId, createdAt: { $gte: timeLimit } }
    ],
    isAnonymous: true
  });
  
  return duplicates.length > 0;
};

// Get anonymous reviews pending verification
reviewSchema.statics.getPendingVerificationReviews = function(options = {}) {
  const { page = 1, limit = 20 } = options;
  
  return this.find({
    isAnonymous: true,
    'anonymousReviewer.isVerified': false,
    status: 'pending',
    'anonymousReviewer.verificationTokenExpires': { $gte: new Date() }
  })
    .populate('business', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Get reviews by IP address for spam detection
reviewSchema.statics.getReviewsByIP = function(ipAddress, timeWindow = 24) {
  const timeLimit = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
  
  return this.find({
    ipAddress: ipAddress,
    createdAt: { $gte: timeLimit }
  }).sort({ createdAt: -1 });
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
// Verify anonymous review email
reviewSchema.methods.verifyAnonymousEmail = function(token) {
  if (!this.isAnonymous) {
    throw new Error('This method is only for anonymous reviews');
  }
  
  if (this.anonymousReviewer.verificationToken !== token) {
    throw new Error('Invalid verification token');
  }
  
  if (new Date() > this.anonymousReviewer.verificationTokenExpires) {
    throw new Error('Verification token has expired');
  }
  
  this.anonymousReviewer.isVerified = true;
  this.anonymousReviewer.verificationToken = undefined;
  this.anonymousReviewer.verificationTokenExpires = undefined;
  this.status = 'published';
  
  return this.save();
};

// Get reviewer display name (works for both anonymous and authenticated)
reviewSchema.methods.getReviewerName = function() {
  if (this.isAnonymous) {
    return this.anonymousReviewer.name;
  }
  return this.user ? `${this.user.firstName} ${this.user.lastName}` : 'Unknown User';
};

// Get reviewer email (works for both anonymous and authenticated)
reviewSchema.methods.getReviewerEmail = function() {
  if (this.isAnonymous) {
    return this.anonymousReviewer.email;
  }
  return this.user ? this.user.email : null;
};

// Check if review is verified (email for anonymous, user account for authenticated)
reviewSchema.methods.isVerifiedReview = function() {
  if (this.isAnonymous) {
    return this.anonymousReviewer.isVerified;
  }
  return !!this.user; // Authenticated users are inherently verified
};

// Calculate spam score based on various factors
reviewSchema.methods.calculateSpamScore = function() {
  let score = 0;
  
  // Content analysis
  if (this.content.length < 10) score += 20;
  if (/^[A-Z\s!]+$/.test(this.content)) score += 15; // All caps
  if (/(.)\1{4,}/.test(this.content)) score += 10; // Repeated characters
  
  // Suspicious patterns
  if (/\b(amazing|best|worst|terrible|horrible)\b/gi.test(this.content)) {
    const matches = this.content.match(/\b(amazing|best|worst|terrible|horrible)\b/gi);
    if (matches && matches.length > 2) score += 15;
  }
  
  // URLs in content
  if (/https?:\/\//.test(this.content)) score += 25;
  
  // Email addresses in content
  if (/@[\w.-]+\.[a-zA-Z]{2,}/.test(this.content)) score += 20;
  
  // Very short review with extreme rating
  if (this.content.length < 20 && (this.rating === 1 || this.rating === 5)) {
    score += 15;
  }
  
  // Multiple submissions from same IP
  if (this.submissionAttempts > 1) score += this.submissionAttempts * 10;
  
  this.spamScore = Math.min(100, score);
  this.isSpam = this.spamScore >= 60;
  
  return this.spamScore;
};
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
reviewSchema.methods.removeReview = function(moderatorId, reason) {
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