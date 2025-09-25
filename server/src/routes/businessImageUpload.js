const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudinaryService = require('../services/cloudinaryService');
const BusinessProfile = require('../models/BusinessProfile');
const { verifyToken, requireRole } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  }
});

// @desc    Upload single business image
// @route   POST /api/upload/business-image
// @access  Private (Business users only)
const uploadBusinessImage = asyncHandler(async (req, res) => {
  console.log('📸 Business image upload request:', {
    businessId: req.body.businessId,
    type: req.body.type,
    filePresent: !!req.file,
    userID: req.user?.id,
    fileName: req.file?.originalname,
    fileSize: req.file?.size
  });

  const { businessId, type } = req.body;
  
  if (!req.file) {
    console.log('❌ No file provided in request');
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  if (!businessId || !type) {
    console.log('❌ Missing businessId or type:', { businessId, type });
    return res.status(400).json({
      success: false,
      message: 'Business ID and image type are required'
    });
  }

  // Verify business ownership
  console.log('🔍 Looking for business:', { businessId, userID: req.user.id });
  const business = await BusinessProfile.findOne({ 
    _id: businessId, 
    owner: req.user.id 
  });
  
  if (!business) {
    console.log('❌ Business not found or access denied');
    // Check if business exists at all
    const anyBusiness = await BusinessProfile.findById(businessId);
    console.log('🔍 Business exists but different owner:', {
      exists: !!anyBusiness,
      actualOwner: anyBusiness?.owner,
      requestingUser: req.user.id
    });
    
    return res.status(404).json({
      success: false,
      message: 'Business not found or access denied'
    });
  }
  
  console.log('✅ Business ownership verified:', business.businessName);

  try {
    // Determine upload folder based on type
    let folder;
    switch (type) {
      case 'logo':
        folder = `servisbeta/businesses/${businessId}/logo`;
        break;
      case 'cover':
        folder = `servisbeta/businesses/${businessId}/cover`;
        break;
      case 'gallery':
        folder = `servisbeta/businesses/${businessId}/gallery`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid image type. Must be logo, cover, or gallery'
        });
    }

    // Convert buffer to base64 for Cloudinary
    console.log('🖼️ Preparing image for Cloudinary:', {
      mimeType: req.file.mimetype,
      bufferSize: req.file.buffer.length,
      folder
    });
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const result = await CloudinaryService.uploadImage(base64Image, folder);
    console.log('✅ Cloudinary upload successful:', {
      url: result.url,
      public_id: result.public_id,
      bytes: result.bytes
    });

    // Update business profile
    let updateQuery = {};
    if (type === 'logo') {
      updateQuery = { 'images.logo': result.url };
    } else if (type === 'cover') {
      updateQuery = { 'images.cover': result.url };
    } else if (type === 'gallery') {
      updateQuery = { $push: { 'images.gallery': result.url } };
    }

    console.log('💾 Updating business profile:', {
      businessId,
      updateQuery,
      type
    });

    const updatedBusiness = await BusinessProfile.findByIdAndUpdate(
      businessId,
      updateQuery,
      { new: true, runValidators: true }
    );

    console.log('✅ Business profile updated successfully:', {
      businessName: updatedBusiness.businessName,
      logoExists: !!updatedBusiness.images?.logo,
      coverExists: !!updatedBusiness.images?.cover,
      galleryCount: updatedBusiness.images?.gallery?.length || 0
    });

    res.status(200).json({
      success: true,
      message: `${type} uploaded successfully`,
      data: {
        url: result.url,
        publicId: result.public_id,
        type: type,
        business: updatedBusiness
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message
    });
  }
});

// @desc    Upload multiple business images (for gallery)
// @route   POST /api/upload/business-gallery
// @access  Private (Business users only)
const uploadBusinessGallery = asyncHandler(async (req, res) => {
  const { businessId } = req.body;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  if (!businessId) {
    return res.status(400).json({
      success: false,
      message: 'Business ID is required'
    });
  }

  // Verify business ownership
  const business = await BusinessProfile.findOne({ 
    _id: businessId, 
    owner: req.user.id 
  });
  
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found or access denied'
    });
  }

  try {
    const folder = `servisbeta/businesses/${businessId}/gallery`;
    const uploadPromises = req.files.map(async (file) => {
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return await CloudinaryService.uploadImage(base64Image, folder);
    });

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.url);

    // Update business profile with new gallery images
    const updatedBusiness = await BusinessProfile.findByIdAndUpdate(
      businessId,
      { $push: { 'images.gallery': { $each: imageUrls } } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${imageUrls.length} images uploaded successfully`,
      data: {
        urls: imageUrls,
        business: updatedBusiness
      }
    });

  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Gallery upload failed',
      error: error.message
    });
  }
});

// @desc    Delete business image
// @route   DELETE /api/upload/business-image
// @access  Private (Business users only)
const deleteBusinessImage = asyncHandler(async (req, res) => {
  const { businessId, imageUrl, type } = req.body;
  
  if (!businessId || !imageUrl || !type) {
    return res.status(400).json({
      success: false,
      message: 'Business ID, image URL, and type are required'
    });
  }

  // Verify business ownership
  const business = await BusinessProfile.findOne({ 
    _id: businessId, 
    owner: req.user.id 
  });
  
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found or access denied'
    });
  }

  try {
    // Extract public ID from Cloudinary URL
    const publicId = CloudinaryService.extractPublicId(imageUrl);
    
    // Delete from Cloudinary
    if (publicId) {
      await CloudinaryService.deleteImage(publicId);
    }

    // Update business profile
    let updateQuery = {};
    if (type === 'logo') {
      updateQuery = { 'images.logo': null };
    } else if (type === 'cover') {
      updateQuery = { 'images.cover': null };
    } else if (type === 'gallery') {
      updateQuery = { $pull: { 'images.gallery': imageUrl } };
    }

    const updatedBusiness = await BusinessProfile.findByIdAndUpdate(
      businessId,
      updateQuery,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${type} deleted successfully`,
      data: {
        business: updatedBusiness
      }
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Image deletion failed',
      error: error.message
    });
  }
});

// @desc    Get business images
// @route   GET /api/upload/business-images/:businessId
// @access  Private (Business users only)
const getBusinessImages = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  // Verify business ownership
  const business = await BusinessProfile.findOne({ 
    _id: businessId, 
    owner: req.user.id 
  });
  
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found or access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      images: business.images || { gallery: [] },
      isComplete: !!(business.images?.logo && business.images?.cover && 
                    business.images?.gallery && business.images.gallery.length >= 2)
    }
  });
});

// Apply middleware and routes
router.use(verifyToken);
router.use(requireRole('business'));

router.post('/business-image', upload.single('image'), uploadBusinessImage);
router.post('/business-gallery', upload.array('images', 8), uploadBusinessGallery);
router.delete('/business-image', deleteBusinessImage);
router.get('/business-images/:businessId', getBusinessImages);

module.exports = router;