const mongoose = require('mongoose');

const reviewDisputeSchema = new mongoose.Schema({
  // References
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessProfile',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Business owner who submitted the dispute
  },

  // Dispute Details
  disputeType: {
    type: String,
    enum: [
      'fake_review',      // Review appears to be fake/spam
      'inappropriate',    // Contains inappropriate content
      'defamatory',      // Contains false/defamatory statements
      'irrelevant',      // Not relevant to the business
      'competitor',      // Posted by competitor
      'extortion',       // User demanding compensation to remove review
      'policy_violation', // Violates platform review policies
      'other'
    ],
    required: true
  },
  
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'screenshot', 'other'],
      required: true
    },
    url: {
      type: String, // Cloudinary URL or external link
      required: true
    },
    description: {
      type: String,
      maxlength: 200
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Additional Context
  additionalInfo: {
    type: String,
    maxlength: 2000,
    trim: true
  },

  // Business Details (for context)
  businessContext: {
    customerInteraction: {
      type: String,
      maxlength: 500,
      trim: true
    },
    serviceDate: Date,
    transactionId: String,
    customerEmail: String // If known, to help verify legitimacy
  },

  // Admin Review Process
  status: {
    type: String,
    enum: [
      'pending',        // Awaiting admin review
      'under_review',   // Admin is investigating
      'requires_info',  // Admin needs more information
      'resolved',       // Dispute resolved (action taken)
      'rejected',       // Dispute rejected (no action needed)
      'escalated'       // Escalated to higher authority
    ],
    default: 'pending'
  },

  // Admin Response
  adminResponse: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who reviewed
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: [
        'remove_review',     // Review will be removed
        'hide_review',       // Review will be hidden but not deleted
        'flag_review',       // Review will be flagged for monitoring
        'warn_user',         // User will be warned about review
        'no_action',         // No action taken - dispute rejected
        'request_more_info', // More information needed
        'partial_action'     // Some action taken (e.g., edit review)
      ]
    },
    notes: {
      type: String,
      maxlength: 1000,
      trim: true
    },
    internalNotes: {
      type: String,
      maxlength: 1000,
      trim: true // Only visible to admins
    }
  },

  // Resolution Details
  resolution: {
    actionTaken: {
      type: String,
      maxlength: 500
    },
    resolvedAt: Date,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    businessNotified: {
      type: Boolean,
      default: false
    },
    businessNotifiedAt: Date
  },

  // Communication Thread
  communications: [{
    from: {
      type: String,
      enum: ['business', 'admin'],
      required: true
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false // True for admin-only messages
    }
  }],

  // Tracking
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  tags: [String], // For categorization and filtering

  // Timestamps and metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
reviewDisputeSchema.index({ review: 1 });
reviewDisputeSchema.index({ business: 1 });
reviewDisputeSchema.index({ submittedBy: 1 });
reviewDisputeSchema.index({ status: 1 });
reviewDisputeSchema.index({ priority: 1 });
reviewDisputeSchema.index({ submittedAt: -1 });
reviewDisputeSchema.index({ 'adminResponse.reviewedBy': 1 });

// Compound indexes
reviewDisputeSchema.index({ status: 1, priority: -1, submittedAt: -1 });
reviewDisputeSchema.index({ business: 1, status: 1 });

// Virtual for dispute age in days
reviewDisputeSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const submitted = this.submittedAt || this.createdAt;
  const diffTime = Math.abs(now - submitted);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for time since last update
reviewDisputeSchema.virtual('daysSinceUpdate').get(function() {
  const now = new Date();
  const updated = this.lastUpdated || this.updatedAt;
  const diffTime = Math.abs(now - updated);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for status display
reviewDisputeSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending Review',
    'under_review': 'Under Review',
    'requires_info': 'Requires Information',
    'resolved': 'Resolved',
    'rejected': 'Rejected',
    'escalated': 'Escalated'
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware to update lastUpdated
reviewDisputeSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static methods
reviewDisputeSchema.statics.getBusinessDisputes = function(businessId, status = null) {
  const query = { business: businessId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('review', 'rating comment user createdAt')
    .populate('submittedBy', 'firstName lastName email')
    .populate('adminResponse.reviewedBy', 'firstName lastName')
    .sort({ submittedAt: -1 });
};

reviewDisputeSchema.statics.getPendingDisputes = function() {
  return this.find({ status: { $in: ['pending', 'under_review'] } })
    .populate('business', 'businessName')
    .populate('review', 'rating comment user')
    .populate('submittedBy', 'firstName lastName email')
    .sort({ priority: -1, submittedAt: 1 });
};

reviewDisputeSchema.statics.getDisputesByAdmin = function(adminId) {
  return this.find({ 'adminResponse.reviewedBy': adminId })
    .populate('business', 'businessName')
    .populate('review', 'rating comment')
    .sort({ 'adminResponse.reviewedAt': -1 });
};

// Instance methods
reviewDisputeSchema.methods.addCommunication = function(from, fromUser, message, isInternal = false) {
  this.communications.push({
    from,
    fromUser,
    message,
    isInternal
  });
  return this.save();
};

reviewDisputeSchema.methods.updateStatus = function(status, adminId = null, decision = null, notes = null) {
  this.status = status;
  
  if (adminId) {
    this.adminResponse = this.adminResponse || {};
    this.adminResponse.reviewedBy = adminId;
    this.adminResponse.reviewedAt = new Date();
    
    if (decision) {
      this.adminResponse.decision = decision;
    }
    
    if (notes) {
      this.adminResponse.notes = notes;
    }
  }

  if (status === 'resolved') {
    this.resolution = this.resolution || {};
    this.resolution.resolvedAt = new Date();
  }

  return this.save();
};

reviewDisputeSchema.methods.escalate = function(reason = null) {
  this.status = 'escalated';
  this.priority = 'high';
  
  if (reason) {
    this.addCommunication('admin', null, `Dispute escalated: ${reason}`, true);
  }
  
  return this.save();
};

module.exports = mongoose.model('ReviewDispute', reviewDisputeSchema);