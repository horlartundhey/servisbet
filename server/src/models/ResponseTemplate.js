const mongoose = require('mongoose');

const responseTemplateSchema = new mongoose.Schema({
  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessProfile',
    required: true
  },

  // Template Details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  },
  
  // Template Content
  template: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  // Template Configuration
  category: {
    type: String,
    enum: [
      'positive',     // For positive reviews (4-5 stars)
      'neutral',      // For neutral reviews (3 stars)
      'negative',     // For negative reviews (1-2 stars)
      'complaint',    // For complaint/issue responses
      'thank_you',    // For thank you messages
      'apology',      // For apology responses
      'follow_up',    // For follow-up messages
      'general'       // General purpose template
    ],
    required: true
  },

  // Rating Range for Auto-Assignment
  ratingRange: {
    min: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    max: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    }
  },

  // Keywords for smart matching
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Template Variables (placeholders)
  variables: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    defaultValue: {
      type: String,
      trim: true
    },
    required: {
      type: Boolean,
      default: false
    }
  }],

  // Usage Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false // One default template per category per business
  },
  autoApply: {
    type: Boolean,
    default: false // Automatically suggest for matching reviews
  },

  // Usage Analytics
  usage: {
    totalUses: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    successfulResponses: {
      type: Number,
      default: 0
    },
    averageRatingImprovement: {
      type: Number,
      default: 0 // Track if responses lead to better follow-up ratings
    }
  },

  // Performance Metrics
  effectiveness: {
    responseRate: {
      type: Number,
      default: 0 // Percentage of reviews that got responses using this template
    },
    businessReplyTime: {
      type: Number,
      default: 0 // Average time to respond using this template
    },
    customerSatisfaction: {
      type: Number,
      default: 0 // Based on follow-up actions or ratings
    }
  },

  // Template Status
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedReason: String,

  // Sharing and Collaboration
  isPublic: {
    type: Boolean,
    default: false // Allow other businesses to use this template
  },
  sharedWith: [{
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      type: String,
      enum: ['view', 'copy', 'edit'],
      default: 'view'
    }
  }],

  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    template: String,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changeReason: String
  }],

  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
responseTemplateSchema.index({ owner: 1, business: 1 });
responseTemplateSchema.index({ business: 1, category: 1 });
responseTemplateSchema.index({ business: 1, isActive: 1 });
responseTemplateSchema.index({ isPublic: 1, category: 1 });
responseTemplateSchema.index({ keywords: 1 });
responseTemplateSchema.index({ tags: 1 });
responseTemplateSchema.index({ 'usage.totalUses': -1 });

// Compound indexes
responseTemplateSchema.index({ 
  business: 1, 
  category: 1, 
  isActive: 1, 
  isDefault: 1 
});

// Ensure only one default template per category per business
responseTemplateSchema.index(
  { business: 1, category: 1, isDefault: 1 },
  { 
    unique: true,
    partialFilterExpression: { isDefault: true }
  }
);

// Virtual for template preview (first 100 characters)
responseTemplateSchema.virtual('preview').get(function() {
  return this.template.length > 100 
    ? this.template.substring(0, 100) + '...'
    : this.template;
});

// Virtual for variable count
responseTemplateSchema.virtual('variableCount').get(function() {
  return this.variables ? this.variables.length : 0;
});

// Virtual for usage rate (uses per month)
responseTemplateSchema.virtual('monthlyUsage').get(function() {
  const monthsOld = Math.max(1, Math.ceil(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));
  return Math.round((this.usage.totalUses || 0) / monthsOld);
});

// Virtual for effectiveness score
responseTemplateSchema.virtual('effectivenessScore').get(function() {
  const responseRate = this.effectiveness.responseRate || 0;
  const satisfaction = this.effectiveness.customerSatisfaction || 0;
  const usage = Math.min(this.usage.totalUses || 0, 10) * 10; // Max 100 points
  
  return Math.round((responseRate + satisfaction + usage) / 3);
});

// Static methods
responseTemplateSchema.statics.getBusinessTemplates = function(businessId, category = null, activeOnly = true) {
  const query = { business: businessId };
  
  if (category) {
    query.category = category;
  }
  
  if (activeOnly) {
    query.isActive = true;
    query.isArchived = false;
  }
  
  return this.find(query)
    .sort({ isDefault: -1, 'usage.totalUses': -1, createdAt: -1 });
};

responseTemplateSchema.statics.getPublicTemplates = function(category = null) {
  const query = { 
    isPublic: true, 
    isActive: true, 
    isArchived: false 
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .populate('business', 'businessName')
    .sort({ 'usage.totalUses': -1, createdAt: -1 });
};

responseTemplateSchema.statics.findSuggestedTemplates = function(businessId, reviewRating, reviewContent) {
  const query = {
    business: businessId,
    isActive: true,
    isArchived: false,
    'ratingRange.min': { $lte: reviewRating },
    'ratingRange.max': { $gte: reviewRating }
  };

  // If review content provided, match keywords
  if (reviewContent) {
    const words = reviewContent.toLowerCase().split(/\s+/);
    query.keywords = { $in: words };
  }

  return this.find(query)
    .sort({ autoApply: -1, 'usage.totalUses': -1 })
    .limit(5);
};

// Instance methods
responseTemplateSchema.methods.incrementUsage = function() {
  this.usage.totalUses = (this.usage.totalUses || 0) + 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

responseTemplateSchema.methods.updateEffectiveness = function(metrics) {
  if (metrics.responseRate !== undefined) {
    this.effectiveness.responseRate = metrics.responseRate;
  }
  if (metrics.businessReplyTime !== undefined) {
    this.effectiveness.businessReplyTime = metrics.businessReplyTime;
  }
  if (metrics.customerSatisfaction !== undefined) {
    this.effectiveness.customerSatisfaction = metrics.customerSatisfaction;
  }
  return this.save();
};

responseTemplateSchema.methods.createVersion = function(newTemplate, updatedBy, changeReason = null) {
  // Store current version in history
  this.previousVersions.push({
    version: this.version,
    template: this.template,
    updatedAt: new Date(),
    updatedBy: updatedBy,
    changeReason: changeReason
  });

  // Update to new version
  this.template = newTemplate;
  this.version += 1;

  return this.save();
};

responseTemplateSchema.methods.archive = function(reason = null) {
  this.isArchived = true;
  this.isActive = false;
  this.archivedAt = new Date();
  if (reason) {
    this.archivedReason = reason;
  }
  return this.save();
};

responseTemplateSchema.methods.shareWith = function(businessId, permissions = 'view') {
  // Check if already shared
  const existingShare = this.sharedWith.find(
    share => share.business.toString() === businessId.toString()
  );

  if (existingShare) {
    existingShare.permissions = permissions;
  } else {
    this.sharedWith.push({
      business: businessId,
      permissions
    });
  }

  return this.save();
};

responseTemplateSchema.methods.processTemplate = function(variables = {}) {
  let processedTemplate = this.template;

  // Replace template variables with provided values or defaults
  this.variables.forEach(variable => {
    const placeholder = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'gi');
    const value = variables[variable.name] || variable.defaultValue || `[${variable.name}]`;
    processedTemplate = processedTemplate.replace(placeholder, value);
  });

  return processedTemplate;
};

// Pre-save middleware
responseTemplateSchema.pre('save', async function(next) {
  // If setting as default, unset other defaults in same category
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { 
        business: this.business,
        category: this.category,
        _id: { $ne: this._id }
      },
      { $set: { isDefault: false } }
    );
  }

  // Extract potential keywords from template if not provided
  if (!this.keywords || this.keywords.length === 0) {
    const words = this.template
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Limit to 10 keywords
    
    this.keywords = [...new Set(words)]; // Remove duplicates
  }

  next();
});

module.exports = mongoose.model('ResponseTemplate', responseTemplateSchema);