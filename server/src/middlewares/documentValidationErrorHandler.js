// Document validation error handler middleware
const DocumentValidator = require('../utils/documentValidator');

const handleDocumentValidationErrors = (err, req, res, next) => {
  // Check if this is a document validation error
  if (err.code === 'LIMIT_FILE_SIZE') {
    const documentValidator = new DocumentValidator();
    return res.status(400).json({
      success: false,
      message: `File size exceeds maximum allowed size (${documentValidator.formatFileSize(documentValidator.maxFileSize)})`,
      code: 'FILE_TOO_LARGE',
      details: {
        maxSize: documentValidator.maxFileSize,
        maxSizeFormatted: documentValidator.formatFileSize(documentValidator.maxFileSize)
      }
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files uploaded. Maximum 2 files allowed (registration document and owner ID).',
      code: 'TOO_MANY_FILES',
      details: {
        maxFiles: 2
      }
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Only "registrationDoc" and "ownerId" fields are allowed.',
      code: 'UNEXPECTED_FILE_FIELD'
    });
  }

  // Handle custom document validation errors
  if (err.message && (
    err.message.includes('Invalid file type') || 
    err.message.includes('Invalid file extension') ||
    err.message.includes('File header does not match')
  )) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'DOCUMENT_VALIDATION_ERROR'
    });
  }

  // Handle Cloudinary upload errors
  if (err.message && err.message.includes('Failed to upload')) {
    return res.status(500).json({
      success: false,
      message: 'Document upload failed. Please try again.',
      code: 'UPLOAD_ERROR',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Pass other errors to the default error handler
  next(err);
};

module.exports = handleDocumentValidationErrors;