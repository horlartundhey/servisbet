const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema({
  // Link to User
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each user can only have one business profile
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

  // Business Images
  images: {
    logo: { type: String }, // Cloudinary URL
    cover: { type: String }, // Cloudinary URL
    gallery: [{ type: String }] // Array of Cloudinary URLs
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
  verificationDocuments: {
    businessLicense: {
      url: String, // Cloudinary URL
      uploadedAt: Date,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
    taxId: {
      url: String,
      uploadedAt: Date,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
    insuranceCertificate: {
      url: String,
      uploadedAt: Date,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
    additionalDocs: [{
      name: String,
      url: String,
      uploadedAt: Date,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }]
  },

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
// Removed owner index - handled by unique: true in schema definition
businessProfileSchema.index({ businessName: 'text', businessDescription: 'text' });
businessProfileSchema.index({ category: 1 });
businessProfileSchema.index({ 'address.city': 1 });
businessProfileSchema.index({ verificationStatus: 1 });

// Virtual for completion percentage
businessProfileSchema.virtual('completionPercentage').get(function() {
  let completed = 0;
  const total = 12; // Total required fields

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

  // Step 3: Images
  if (this.images && this.images.logo) completed += 1;
  if (this.images && this.images.cover) completed += 1;

  // Step 4: Verification documents
  if (this.verificationDocuments && this.verificationDocuments.businessLicense && this.verificationDocuments.businessLicense.url) completed += 1;
  if (this.verificationDocuments && this.verificationDocuments.taxId && this.verificationDocuments.taxId.url) completed += 1;

  return Math.round((completed / total) * 100);
});

// Method to check if step is complete
businessProfileSchema.methods.isStepComplete = function(step) {
  switch (step) {
    case 1: // Basic info - always complete if profile exists
      return true;
    case 2: // Business details
      return !!(this.businessName && this.businessDescription && this.category && 
               this.businessEmail && this.businessPhone && this.address && this.address.street);
    case 3: // Documents
      return !!(this.verificationDocuments && this.verificationDocuments.businessLicense && 
               this.verificationDocuments.businessLicense.url);
    case 4: // Verification
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

// Pre-save middleware to update completion status
businessProfileSchema.pre('save', function(next) {
  // Update completion step
  this.profileCompletionStep = this.getNextStep();
  
  // Check if profile is complete
  this.isProfileComplete = this.isStepComplete(2) && this.isStepComplete(3);
  
  // Update verification status
  if (this.isProfileComplete && this.verificationStatus === 'incomplete') {
    this.verificationStatus = 'pending';
  }
  
  next();
});

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
