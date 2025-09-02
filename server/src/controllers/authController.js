const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('../middlewares/asyncHandler');
const emailService = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRE || '30d' 
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, firstName, lastName, email, password, role } = req.body;

  // Handle both name (for backward compatibility) and firstName/lastName
  let userFirstName, userLastName;
  
  if (firstName && lastName) {
    userFirstName = firstName;
    userLastName = lastName;
  } else if (name) {
    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    userFirstName = nameParts[0];
    userLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
  } else {
    return res.status(400).json({
      success: false,
      message: 'Please provide name (or firstName and lastName), email and password'
    });
  }

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email and password'
    });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  // Create user
  const user = await User.create({
    firstName: userFirstName,
    lastName: userLastName,
    email,
    password,
    role: role || 'user'
  });

  if (user) {
    // Generate email verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email (non-blocking)
    try {
      console.log('🔄 Attempting to send verification email...');
      console.log('📧 Email:', email);
      console.log('👤 Name:', userFirstName);
      console.log('🔐 Token:', verificationToken);
      console.log('🌍 Environment:', process.env.NODE_ENV);
      
      await emailService.sendVerificationEmail(email, userFirstName, verificationToken);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError.message);
      // Don't fail registration if email fails - just log it
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isEmailVerified,
        // DO NOT provide token until email is verified
        requiresEmailVerification: true
      },
      message: 'Registration successful! Please check your email and click the verification link before logging in.'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid user data'
    });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before logging in',
      code: 'EMAIL_NOT_VERIFIED',
      data: {
        email: user.email,
        canResendVerification: true
      }
    });
  }

  // Login successful
  res.json({
    success: true,
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isEmailVerified,
      token: generateToken(user._id)
    },
    message: 'Login successful'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user,
    message: 'User details updated successfully'
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    },
    message: 'Password updated successfully'
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  // Find user with verification token that hasn't expired
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Send business verification reminder for business accounts
  if (user.role === 'business') {
    try {
      await emailService.sendBusinessVerificationReminder(user.email, user.firstName);
    } catch (emailError) {
      console.error('Failed to send business verification reminder:', emailError);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully!'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate new verification token
  const verificationToken = user.generateVerificationToken();
  await user.save();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with that email'
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email'
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }

  // Find user with reset token that hasn't expired
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    },
    message: 'Password reset successfully'
  });
});

// @desc    Resend verification email (public endpoint)
// @route   POST /api/auth/resend-verification-public
// @access  Public
const resendVerificationEmailPublic = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate new verification token
  const verificationToken = user.generateVerificationToken();
  await user.save();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.log('❌ Email sending failed:', error.message);
    // Don't fail the request if email service is down
    res.status(200).json({
      success: true,
      message: 'Verification email request processed. If you don\'t receive it, please try again later.'
    });
  }
});

// @desc    Check email availability
// @route   POST /api/auth/check-email
// @access  Public
const checkEmailAvailability = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const userExists = await User.findOne({ email });

  res.status(200).json({
    success: true,
    available: !userExists,
    message: userExists ? 'Email is already taken' : 'Email is available'
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateDetails,
  updatePassword,
  verifyEmail,
  resendVerificationEmail,
  resendVerificationEmailPublic,
  forgotPassword,
  resetPassword,
  checkEmailAvailability
};
