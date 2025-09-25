const multer = require('multer');

/**
 * Middleware to handle multer upload errors
 */
const uploadErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size allowed is 5MB per image.',
          error: 'FILE_TOO_LARGE'
        });
        
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 images allowed per review.',
          error: 'TOO_MANY_FILES'
        });
        
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Only "photos" field is allowed.',
          error: 'UNEXPECTED_FIELD'
        });
        
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error occurred.',
          error: 'UPLOAD_ERROR'
        });
    }
  }
  
  // Handle Cloudinary errors
  if (error.message && error.message.includes('cloudinary')) {
    return res.status(400).json({
      success: false,
      message: 'Image processing failed. Please try with different images.',
      error: 'CLOUDINARY_ERROR'
    });
  }
  
  // Handle other errors
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Upload failed',
      error: 'UPLOAD_FAILED'
    });
  }
  
  next();
};

module.exports = uploadErrorHandler;