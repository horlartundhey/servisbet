const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  // Basic Info
  name: { 
    type: String, 
    required: true,
    trim: true
    // Removed index: true to avoid duplication with separate index definition
  },
  slug: { 
    type: String, 
    unique: true,
    lowercase: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  category: { 
    type: String, 
    required: true
    // Removed index: true to avoid duplication with separate index definition
  },
  
  // Contact & Location
  email: { 
    type: String,
    lowercase: true,
    trim: true
  },
  phone: { type: String },
  website: { type: String },
  address: {
    street: { type: String },
    city: { type: String }, // Removed index: true to avoid duplication
    state: { type: String },
    country: { type: String, default: 'Nigeria' },
    postalCode: { type: String },
    
    // ✅ GEOSPATIAL DATA - Ready for MongoDB 2dsphere indexing
    coordinates: {
      type: { 
        type: String, 
        enum: ['Point'], 
        default: 'Point' 
      },
      coordinates: {
        type: [Number], // [longitude, latitude] - CRITICAL: lng first!
        index: '2dsphere'
      }
    },
    
    // Alternative: Simple lat/lng (for easier frontend input)
    latitude: { type: Number },
    longitude: { type: Number }
  },
  
  // Branding
  logo: { type: String }, // Cloudinary URL
  banner: { type: String }, // Cloudinary URL
  images: [{ type: String }], // Array of Cloudinary URLs
  
  // Ownership & Verification
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
    // Removed index: true to avoid duplication with separate index definition
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: [{ type: String }], // Cloudinary URLs
  
  // Ratings & Trust (calculated fields)
  averageRating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
    // Removed index: -1 to avoid duplication with separate index definition
  },
  totalReviews: { 
    type: Number, 
    default: 0 
  },
  trustScore: { 
    type: Number, 
    default: 50,
    min: 0,
    max: 100
    // Removed index: -1 to avoid duplication with separate index definition
  },
  
  // Business Hours
  businessHours: {
    monday: { 
      open: { type: String },
      close: { type: String },
      closed: { type: Boolean, default: false }
    },
    tuesday: { 
      open: { type: String },
      close: { type: String },
      closed: { type: Boolean, default: false }
    },
    wednesday: { 
      open: { type: String },
      close: { type: String },
      closed: { type: Boolean, default: false }
    },
    thursday: { 
      open: { type: String },
      close: { type: String },
      closed: { type: Boolean, default: false }
    },
    friday: { 
      open: { type: String },
      close: { type: String },
      closed: { type: Boolean, default: false }
    },
    saturday: { 
      open: { type: String },
      close: { type: String },
      closed: { type: Boolean, default: false }
    },
    sunday: { 
      open: { type: String },
      close: { type: String },
      closed: { type: Boolean, default: true }
    }
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'banned'], 
    default: 'active'
    // Removed index: true to avoid duplication with separate index definition
  },
  
  // SEO & Discovery
  tags: [{ 
    type: String
    // Removed index: true to avoid duplication with separate index definition
  }], // searchable keywords
  
  // Subscription reference
  subscription: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subscription' 
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
// Basic indexes
businessSchema.index({ name: 1 });
// Removed slug index - handled by unique: true in schema definition
businessSchema.index({ category: 1 });
businessSchema.index({ owner: 1 });
businessSchema.index({ 'address.city': 1 });
businessSchema.index({ status: 1 });

// ✅ GEOSPATIAL INDEXES - Essential for location-based search
businessSchema.index({ 'address.coordinates': '2dsphere' });

// Combined indexes for optimized location + filter queries
businessSchema.index({ 
  'address.coordinates': '2dsphere', 
  category: 1, 
  averageRating: -1,
  status: 1
});

businessSchema.index({ averageRating: -1 });
businessSchema.index({ trustScore: -1 });
businessSchema.index({ tags: 1 });

// ✅ TEXT SEARCH INDEXES - For name/description search
businessSchema.index({
  name: 'text',
  description: 'text', 
  tags: 'text',
  'address.city': 'text'
}, {
  weights: {
    name: 10,
    tags: 5,
    description: 2,
    'address.city': 3
  },
  name: 'business_text_search'
});

// ✅ MIDDLEWARE
// Generate slug from name before saving
businessSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    // Ensure uniqueness
    const existingBusiness = await mongoose.models.Business.findOne({ 
      slug: this.slug, 
      _id: { $ne: this._id } 
    });
    
    if (existingBusiness) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Update the updatedAt field before saving
businessSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ VIRTUAL FIELDS
// Full address as a single string
businessSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  
  return [addr.street, addr.city, addr.state, addr.country]
    .filter(Boolean)
    .join(', ');
});

// Rating display (e.g., "4.5 (123 reviews)")
businessSchema.virtual('ratingDisplay').get(function() {
  if (this.totalReviews === 0) return 'No reviews yet';
  const rating = this.averageRating || 0;
  return `${rating.toFixed(1)} (${this.totalReviews} review${this.totalReviews === 1 ? '' : 's'})`;
});

// Business profile completion percentage
businessSchema.virtual('profileCompletion').get(function() {
  let completedFields = 0;
  const totalFields = 8;
  
  if (this.name) completedFields++;
  if (this.description) completedFields++;
  if (this.logo) completedFields++;
  if (this.phone) completedFields++;
  if (this.email) completedFields++;
  if (this.address && this.address.city) completedFields++;
  if (this.businessHours) completedFields++;
  if (this.tags && this.tags.length > 0) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
});

// ✅ STATIC METHODS
// Find businesses near a location
businessSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // meters
      }
    },
    status: 'active'
  });
};

// Search businesses by text
businessSchema.statics.searchByText = function(query, options = {}) {
  const searchQuery = {
    $text: { $search: query },
    status: 'active'
  };
  
  // Add category filter if provided
  if (options.category) {
    searchQuery.category = options.category;
  }
  
  // Add location filter if provided
  if (options.city) {
    searchQuery['address.city'] = new RegExp(options.city, 'i');
  }
  
  return this.find(searchQuery, { 
    score: { $meta: 'textScore' } 
  }).sort({ 
    score: { $meta: 'textScore' },
    averageRating: -1
  });
};

// ✅ INSTANCE METHODS
// Update rating statistics (call this when reviews change)
businessSchema.methods.updateRatingStats = async function() {
  const Review = mongoose.model('Review');
  
  const stats = await Review.aggregate([
    { 
      $match: { 
        business: this._id, 
        status: 'published' 
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
  
  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal
    this.totalReviews = stats[0].totalReviews;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }
  
  return this.save();
};

// Check if business is open now
businessSchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = this.businessHours[dayName];
  if (!todayHours || todayHours.closed) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

module.exports = mongoose.model('Business', businessSchema);