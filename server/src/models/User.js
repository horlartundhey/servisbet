const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info - Split name for better data management
  firstName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50 
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: true, // Always required now
    minlength: 6 
  },
  
  // Authentication & Verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  // Profile Information
  avatar: { 
    type: String, // Cloudinary URL
    default: null 
  },
  phone: { 
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: { type: Date },
  
  // Role & Status Management
  role: { 
    type: String, 
    enum: {
      values: ['user', 'business', 'admin'],
      message: '{VALUE} is not a valid role'
    },
    default: 'user' 
  },
  status: { 
    type: String, 
    enum: {
      values: ['active', 'suspended', 'banned'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active' 
  },
  
  // OAuth Integration
  googleId: { type: String },
  loginProvider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
  },
  
  // Activity Tracking
  lastLogin: { type: Date },
  loginCount: { 
    type: Number, 
    default: 0 
  },
  
  // Computed field for full name
  fullName: {
    type: String,
    get: function() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetExpires;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for Performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save Middleware
userSchema.pre('save', async function (next) {
  // Hash password only if it's modified and not empty
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastLogin and loginCount on successful login
userSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // For OAuth users
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return this.emailVerificationToken;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.passwordResetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return this.passwordResetToken;
};

// Check if user can perform admin actions
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Check if user can manage businesses
userSchema.methods.canManageBusinesses = function() {
  return this.role === 'business' || this.role === 'admin';
};

// Check if account is active
userSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Virtual for user's full name
userSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for user's age (if dateOfBirth is provided)
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, status: 'active' });
};

// Static method to find verified users
userSchema.statics.findVerified = function() {
  return this.find({ isEmailVerified: true, status: 'active' });
};

module.exports = mongoose.model('User', userSchema);