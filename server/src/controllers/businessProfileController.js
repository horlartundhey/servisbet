const BusinessProfile = require('../models/BusinessProfile');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get business profile
// @route   GET /api/business-profile
// @access  Private (Business users only)
const getBusinessProfile = asyncHandler(async (req, res) => {
  const profile = await BusinessProfile.findOne({ owner: req.user.id })
    .populate('owner', 'firstName lastName email');

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Business profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Create or update business profile
// @route   POST /api/business-profile
// @access  Private (Business users only)
const createOrUpdateBusinessProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Check if user is business type
  const user = await User.findById(userId);
  if (user.role !== 'business') {
    return res.status(403).json({
      success: false,
      message: 'Only business users can create business profiles'
    });
  }

  let profile = await BusinessProfile.findOne({ owner: userId });
  
  if (profile) {
    // Update existing profile
    profile = await BusinessProfile.findOneAndUpdate(
      { owner: userId },
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Business profile updated successfully'
    });
  } else {
    // Create new profile
    profile = await BusinessProfile.create({
      owner: userId,
      ...req.body
    });
    
    await profile.populate('owner', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: profile,
      message: 'Business profile created successfully'
    });
  }
});

// @desc    Update business details (Step 2)
// @route   PUT /api/business-profile/details
// @access  Private (Business users only)
const updateBusinessDetails = asyncHandler(async (req, res) => {
  const {
    businessName,
    businessDescription,
    category,
    subcategory,
    businessEmail,
    businessPhone,
    website,
    address,
    businessHours,
    socialMedia
  } = req.body;

  let profile = await BusinessProfile.findOne({ owner: req.user.id });
  
  if (!profile) {
    // Create profile if it doesn't exist
    profile = await BusinessProfile.create({
      owner: req.user.id,
      businessName,
      businessDescription,
      category,
      subcategory,
      businessEmail,
      businessPhone,
      website,
      address,
      businessHours,
      socialMedia
    });
  } else {
    // Update existing profile
    profile = await BusinessProfile.findOneAndUpdate(
      { owner: req.user.id },
      {
        businessName,
        businessDescription,
        category,
        subcategory,
        businessEmail,
        businessPhone,
        website,
        address,
        businessHours,
        socialMedia
      },
      { new: true, runValidators: true }
    );
  }

  await profile.populate('owner', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: profile,
    message: 'Business details updated successfully'
  });
});

// @desc    Upload business images
// @route   PUT /api/business-profile/images
// @access  Private (Business users only)
const updateBusinessImages = asyncHandler(async (req, res) => {
  const { logo, cover, gallery } = req.body;

  const profile = await BusinessProfile.findOneAndUpdate(
    { owner: req.user.id },
    {
      'images.logo': logo,
      'images.cover': cover,
      'images.gallery': gallery
    },
    { new: true, runValidators: true }
  ).populate('owner', 'firstName lastName email');

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Business profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: profile,
    message: 'Business images updated successfully'
  });
});

// @desc    Upload verification documents (Step 3)
// @route   PUT /api/business-profile/documents
// @access  Private (Business users only)
const uploadVerificationDocuments = asyncHandler(async (req, res) => {
  const { businessLicense, taxId, insuranceCertificate, additionalDocs } = req.body;

  const updateData = {};
  
  if (businessLicense) {
    updateData['verificationDocuments.businessLicense'] = {
      ...businessLicense,
      uploadedAt: new Date(),
      status: 'pending'
    };
  }
  
  if (taxId) {
    updateData['verificationDocuments.taxId'] = {
      ...taxId,
      uploadedAt: new Date(),
      status: 'pending'
    };
  }
  
  if (insuranceCertificate) {
    updateData['verificationDocuments.insuranceCertificate'] = {
      ...insuranceCertificate,
      uploadedAt: new Date(),
      status: 'pending'
    };
  }
  
  if (additionalDocs) {
    updateData['verificationDocuments.additionalDocs'] = additionalDocs.map(doc => ({
      ...doc,
      uploadedAt: new Date(),
      status: 'pending'
    }));
  }

  const profile = await BusinessProfile.findOneAndUpdate(
    { owner: req.user.id },
    updateData,
    { new: true, runValidators: true }
  ).populate('owner', 'firstName lastName email');

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Business profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: profile,
    message: 'Verification documents uploaded successfully'
  });
});

// @desc    Get business profile completion status
// @route   GET /api/business-profile/completion
// @access  Private (Business users only)
const getCompletionStatus = asyncHandler(async (req, res) => {
  const profile = await BusinessProfile.findOne({ owner: req.user.id });
  
  if (!profile) {
    return res.status(200).json({
      success: true,
      data: {
        currentStep: 1,
        completionPercentage: 25,
        steps: {
          1: { completed: true, name: 'Basic Information' },
          2: { completed: false, name: 'Business Details' },
          3: { completed: false, name: 'Verification Documents' },
          4: { completed: false, name: 'Email Verification' }
        }
      }
    });
  }

  const steps = {
    1: { completed: true, name: 'Basic Information' },
    2: { completed: profile.isStepComplete(2), name: 'Business Details' },
    3: { completed: profile.isStepComplete(3), name: 'Verification Documents' },
    4: { completed: profile.isStepComplete(4), name: 'Email Verification' }
  };

  res.status(200).json({
    success: true,
    data: {
      currentStep: profile.profileCompletionStep,
      completionPercentage: profile.completionPercentage,
      steps,
      verificationStatus: profile.verificationStatus
    }
  });
});

// @desc    Delete business profile
// @route   DELETE /api/business-profile
// @access  Private (Business users only)
const deleteBusinessProfile = asyncHandler(async (req, res) => {
  const profile = await BusinessProfile.findOneAndDelete({ owner: req.user.id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Business profile not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Business profile deleted successfully'
  });
});

module.exports = {
  getBusinessProfile,
  createOrUpdateBusinessProfile,
  updateBusinessDetails,
  updateBusinessImages,
  uploadVerificationDocuments,
  getCompletionStatus,
  deleteBusinessProfile
};
