const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema({
  // Link to User (now supports multiple businesses per user)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Business Identification
  businessSlug: {
    type: String,
    required: false, // Auto-generated from businessName in pre-save hook
    unique: true, // Each business must have a unique slug
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-z0-9-]+$/ // Only lowercase letters, numbers, and hyphens
  },
  isActive: {
    type: Boolean,
    default: true // For soft deletion
  },
  isPrimary: {
    type: Boolean,
    default: false // One primary business per user for quick access
  },

  // Step 2: Business Details
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  businessDescription: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Restaurant', 'Hotel', 'Retail', 'Healthcare', 'Beauty', 'Automotive',
      'Technology', 'Education', 'Financial', 'Legal', 'Real Estate',
      'Entertainment', 'Fitness', 'Home Services', 'Professional Services',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    maxlength: 50
  },
  
  // Contact Information
  businessEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  businessPhone: {
    type: String,
    required: true
  },
  website: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid website URL'
    }
  },

  // Address Information
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'United States' },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },

  // Business Hours
  businessHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },

  // Business Images (Only logo required)
  images: {
    logo: { 
      type: String, 
      required: true, // Logo is required
      validate: {
        validator: function(v) {
          return v && v.trim().length > 0;
        },
        message: 'Business logo is required'
      }
    },
    cover: { 
      type: String, 
      required: false, // Cover image is optional
      default: ''
    },
    gallery: {
      type: [{ type: String }], // Array of Cloudinary URLs
      required: false, // Gallery is optional
      default: []
    }
  },

  // Social Media
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    youtube: String
  },

  // Step 3: Verification Documents

  // Flexible array for uploaded verification docs (step 2)
  verificationDocs: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'registration', 'owner_id', 'other'
    fileName: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    validationHash: { type: String },
    validated: { type: Boolean, default: false }
  }],

  // Optionally keep the old structure for legacy support

  // Verification Status
  profileCompletionStep: {
    type: Number,
    default: 1, // 1: Basic info, 2: Business details, 3: Documents, 4: Verified
    min: 1,
    max: 4
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['incomplete', 'pending', 'approved', 'rejected'],
    default: 'incomplete'
  },
  verificationNotes: String,
  verifiedAt: Date,

  // Business Statistics (calculated fields)
  stats: {
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    claimedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// NOTE: Removed owner: 1 index - owner field should NOT be unique since we support multiple businesses per user
businessProfileSchema.index({ owner: 1, isPrimary: 1 }); // For finding primary business
businessProfileSchema.index({ businessName: 'text', businessDescription: 'text' });
businessProfileSchema.index({ category: 1 });
businessProfileSchema.index({ 'address.city': 1 });
businessProfileSchema.index({ verificationStatus: 1 });
businessProfileSchema.index({ isActive: 1 });

// Virtual for completion percentage
businessProfileSchema.virtual('completionPercentage').get(function() {
  let completed = 0;
  const total = 15; // Updated total required fields including mandatory images

  // Step 1: Basic info (from User model - always completed if profile exists)
  completed += 1;

  // Step 2: Business details
  if (this.businessName) completed += 1;
  if (this.businessDescription) completed += 1;
  if (this.category) completed += 1;
  if (this.businessEmail) completed += 1;
  if (this.businessPhone) completed += 1;
  if (this.address && this.address.street) completed += 1;
  if (this.businessHours) completed += 1;

  // Step 3: Images (Now mandatory)
  if (this.images && this.images.logo) completed += 1;
  if (this.images && this.images.cover) completed += 1;
  if (this.images && this.images.gallery && this.images.gallery.length >= 2) completed += 1;

  // Step 4: Verification documents
  if (this.verificationDocs && this.verificationDocs.length > 0) {
    // Check for at least one valid verification document
    const hasValidDoc = this.verificationDocs.some(doc => doc.url && doc.validated);
    if (hasValidDoc) completed += 1;
  }

  // Step 5: Profile completion requirements
  if (this.isProfileComplete) completed += 1;
  if (this.verificationStatus === 'approved') completed += 2; // Extra weight for approval

  return Math.round((completed / total) * 100);
});

// Method to check if step is complete
businessProfileSchema.methods.isStepComplete = function(step) {
  switch (step) {
    case 1: // Basic info - always complete if profile exists
      return true;
    case 2: // Business details (including mandatory images)
      return !!(this.businessName && this.businessDescription && this.category && 
               this.businessEmail && this.businessPhone && this.address && this.address.street &&
               this.images && this.images.logo && this.images.cover && 
               this.images.gallery && this.images.gallery.length >= 2);
    case 3: // Verification documents
      return !!(this.verificationDocs && this.verificationDocs.length > 0 &&
               this.verificationDocs.some(doc => doc.url && doc.validated));
    case 4: // Admin verification approval
      return this.verificationStatus === 'approved';
    default:
      return false;
  }
};

// Method to get next incomplete step
businessProfileSchema.methods.getNextStep = function() {
  for (let step = 1; step <= 4; step++) {
    if (!this.isStepComplete(step)) {
      return step;
    }
  }
  return 4; // All steps complete
};

// Static method to get user's businesses
businessProfileSchema.statics.getUserBusinesses = function(userId, activeOnly = true) {
  const query = { owner: userId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ isPrimary: -1, createdAt: -1 });
};

// Static method to get user's primary business
businessProfileSchema.statics.getUserPrimaryBusiness = function(userId) {
  return this.findOne({ owner: userId, isPrimary: true, isActive: true });
};

// Static method to find business by slug
businessProfileSchema.statics.findBySlug = function(slug) {
  return this.findOne({ businessSlug: slug, isActive: true });
};

// Method to deactivate business (soft delete)
businessProfileSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save({ validateBeforeSave: false });
};

// Method to set as primary business
businessProfileSchema.methods.setPrimary = async function() {
  // Unset other primary businesses for this user
  await this.constructor.updateMany(
    { owner: this.owner, _id: { $ne: this._id } },
    { $set: { isPrimary: false } }
  );
  
  this.isPrimary = true;
  return this.save();
};

// Pre-save middleware to update completion status and handle primary business logic
businessProfileSchema.pre('save', async function(next) {
  // If this business is being set as primary, unset other primary businesses for this user
  if (this.isPrimary && this.isModified('isPrimary')) {
    await this.constructor.updateMany(
      { owner: this.owner, _id: { $ne: this._id } },
      { $set: { isPrimary: false } }
    );
  }
  
  // If this is the user's first business, make it primary
  if (this.isNew) {
    const businessCount = await this.constructor.countDocuments({ 
      owner: this.owner, 
      isActive: true 
    });
    if (businessCount === 0) {
      this.isPrimary = true;
    }
  }
  
  // Generate slug if not provided
  if (!this.businessSlug && this.businessName) {
    let baseSlug = this.businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await this.constructor.findOne({ businessSlug: slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.businessSlug = slug;
  }
  
  // Update completion step
  this.profileCompletionStep = this.getNextStep();
  
  // Check if profile is complete (business details + images + documents)
  this.isProfileComplete = this.isStepComplete(2) && this.isStepComplete(3);

  // Automatically update verification status based on documents
  // If documents have been uploaded and status is still 'incomplete', change to 'pending'
  if (this.verificationDocs && this.verificationDocs.length > 0 && 
      this.verificationStatus === 'incomplete') {
    this.verificationStatus = 'pending';
  }
  // If all documents have been removed and status is 'pending', change back to 'incomplete'
  if ((!this.verificationDocs || this.verificationDocs.length === 0) && 
      this.verificationStatus === 'pending' && 
      this.isModified('verificationDocs')) {
    this.verificationStatus = 'incomplete';
  }
  
  // NOTE: Do NOT reset verification status based on isProfileComplete
  // Verification is a separate process that happens after documents are uploaded
  // The admin will approve/reject regardless of whether the profile is 100% complete
  
  next();
});

// Static method to update review statistics
businessProfileSchema.statics.updateReviewStats = async function(businessId) {
  try {
    const Review = mongoose.model('Review');
    
    // Get all published reviews for this business
    const reviews = await Review.find({ 
      business: businessId, 
      status: 'published' 
    });
    
    const totalReviews = reviews.length;
    let averageRating = 0;
    
    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / totalReviews) * 10) / 10; // Round to 1 decimal
    }
    
    // Update the business with the new stats
    await this.findByIdAndUpdate(businessId, {
      'stats.totalReviews': totalReviews,
      'stats.averageRating': averageRating
    });
    
    console.log(`Updated review stats for business ${businessId}: ${totalReviews} reviews, ${averageRating} avg rating`);
  } catch (error) {
    console.error('Error updating review stats:', error);
  }
};

// Clear the model from mongoose cache if it exists (for development)
if (mongoose.models.BusinessProfile) {
  delete mongoose.models.BusinessProfile;
}

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
