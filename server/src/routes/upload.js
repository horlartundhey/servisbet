const express = require('express');
const router = express.Router();
const CloudinaryService = require('../services/cloudinaryService');
const { verifyToken } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private
const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  try {
    const result = await CloudinaryService.uploadImage(
      req.file.path,
      req.body.folder || 'servisbeta/general'
    );

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  try {
    const imagePaths = req.files.map(file => file.path);
    const results = await CloudinaryService.uploadMultipleImages(
      imagePaths,
      req.body.folder || 'servisbeta/general'
    );

    res.status(200).json({
      success: true,
      message: `${results.length} images uploaded successfully`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete image
// @route   DELETE /api/upload/:publicId
// @access  Private
const deleteImage = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;
    // Replace underscores with slashes for nested folder structure
    const actualPublicId = publicId.replace(/_/g, '/');
    
    const result = await CloudinaryService.deleteImage(actualPublicId);
    
    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create upload middleware
const uploadMiddleware = CloudinaryService.createUploadMiddleware('servisbeta', 10);

// Routes
router.post('/single', verifyToken, uploadMiddleware.single('image'), uploadSingle);
router.post('/multiple', verifyToken, uploadMiddleware.array('images', 10), uploadMultiple);
router.delete('/:publicId', verifyToken, deleteImage);

module.exports = router;
