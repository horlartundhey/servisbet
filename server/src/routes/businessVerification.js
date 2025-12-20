const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');
const multer = require('multer');
const path = require('path');
const BusinessProfile = require('../models/BusinessProfile');
const cloudinary = require('../config/cloudinary');
const DocumentValidator = require('../utils/documentValidator');
const handleDocumentValidationErrors = require('../middlewares/documentValidationErrorHandler');

// Initialize document validator
const documentValidator = new DocumentValidator();

// Enhanced file validation middleware using DocumentValidator
const fileFilter = (req, file, cb) => {
  // Determine document type based on field name
  const docType = file.fieldname === 'registrationDoc' ? 'registration' : 'owner_id';
  
  // Basic validation without buffer (full validation will happen in route handler)
  const validationResult = documentValidator.validateFileBasic(file, docType);
  
  if (!validationResult.valid) {
    const errorMessage = validationResult.errors.join('; ');
    cb(new Error(errorMessage), false);
    return;
  }

  // Log any warnings
  if (validationResult.warnings.length > 0) {
    console.warn(`Document validation warnings for ${file.originalname}:`, validationResult.warnings);
  }
  
  cb(null, true);
};

// File size validation
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB limit
  files: 2 // Max 2 files (registration doc + owner ID)
};

// Use memory storage for file processing before Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter,
  limits
});

// Helper function to upload document to Cloudinary
const uploadDocumentToCloudinary = async (fileBuffer, originalName, businessId, docType, validationMetadata = null) => {
  try {
    // Determine resource type based on file extension
    const ext = path.extname(originalName).toLowerCase();
    const resourceType = ext === '.pdf' ? 'raw' : 'image';
    
    // Create context metadata for Cloudinary
    const contextMetadata = {
      document_type: docType,
      business_id: businessId,
      original_name: originalName,
      upload_timestamp: new Date().toISOString()
    };

    // Add validation metadata if available
    if (validationMetadata) {
      contextMetadata.file_hash = validationMetadata.hash;
      contextMetadata.validated = 'true';
      contextMetadata.validation_timestamp = new Date().toISOString();
    }
    
    const result = await cloudinary.uploader.upload(`data:${getFileDataURL(fileBuffer, ext)};base64,${fileBuffer.toString('base64')}`, {
      folder: `servisbeta/business-verification/${businessId}`,
      resource_type: resourceType,
      public_id: `${docType}_${Date.now()}`,
      tags: ['business_verification', docType, businessId, 'validated'],
      context: contextMetadata
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: docType,
      fileName: originalName,
      size: result.bytes || fileBuffer.length,
      uploadedAt: new Date(),
      validationHash: validationMetadata?.hash,
      validated: true
    };
  } catch (error) {
    throw new Error(`Failed to upload ${docType}: ${error.message}`);
  }
};

// Helper function to get correct data URL based on file type
const getFileDataURL = (buffer, ext) => {
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

// @desc    Approve a business verification
// @route   POST /api/business-verification/:id/approve
// @access  Private (Admin only)
router.post('/:id/approve', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { feedback } = req.body;
  const business = await BusinessProfile.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        verificationStatus: 'approved',
        verificationFeedback: feedback || '',
        verifiedAt: new Date()
      }
    },
    { new: true }
  ).populate('owner', 'firstName lastName email');

  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  // TODO: Send approval email to business owner

  res.status(200).json({ success: true, message: 'Business approved and owner notified.', business });
}));

// @desc    Reject a business verification
// @route   POST /api/business-verification/:id/reject
// @access  Private (Admin only)
router.post('/:id/reject', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { feedback } = req.body;
  const business = await BusinessProfile.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        verificationStatus: 'rejected',
        verificationFeedback: feedback || '',
        verifiedAt: null
      }
    },
    { new: true }
  ).populate('owner', 'firstName lastName email');

  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  // TODO: Send rejection email to business owner

  res.status(200).json({ success: true, message: 'Business rejected and owner notified.', business });
}));

// @desc    Get all pending business verification requests
// @route   GET /api/business-verification/pending
// @access  Private (Admin only)
router.get('/pending', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const pendingBusinesses = await BusinessProfile.find({ verificationStatus: 'pending' })
    .populate('owner', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: pendingBusinesses
  });
}));

// @desc    Upload business verification documents
// @route   POST /api/business/:id/upload-documents
// @access  Private (Business owner or admin)
router.post('/:id/upload-documents', verifyToken, requireRole('business', 'admin'), upload.fields([
  { name: 'registrationDoc', maxCount: 1 },
  { name: 'ownerId', maxCount: 1 }
]), handleDocumentValidationErrors, asyncHandler(async (req, res) => {
  const businessId = req.params.id;
  const notes = req.body.notes || '';
  const files = req.files;

  // Validate required files
  if (!files || !files.registrationDoc || !files.ownerId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both registration document and owner ID are required.',
      code: 'MISSING_DOCUMENTS'
    });
  }

  // Enhanced file validation using DocumentValidator
  const registrationDoc = files.registrationDoc[0];
  const ownerId = files.ownerId[0];

  // Validate registration document
  const registrationValidation = documentValidator.validateDocument(registrationDoc, 'registration');
  if (!registrationValidation.valid) {
    return res.status(400).json({
      success: false,
      message: `Registration document validation failed: ${registrationValidation.errors.join('; ')}`,
      code: 'INVALID_REGISTRATION_DOC',
      details: registrationValidation
    });
  }

  // Validate owner ID document
  const ownerIdValidation = documentValidator.validateDocument(ownerId, 'owner_id');
  if (!ownerIdValidation.valid) {
    return res.status(400).json({
      success: false,
      message: `Owner ID document validation failed: ${ownerIdValidation.errors.join('; ')}`,
      code: 'INVALID_OWNER_ID_DOC',
      details: ownerIdValidation
    });
  }

  // Log validation summaries
  console.log('Document validation results:', {
    registration: documentValidator.getValidationSummary(registrationValidation),
    ownerId: documentValidator.getValidationSummary(ownerIdValidation)
  });

  // Log any warnings
  if (registrationValidation.warnings.length > 0) {
    console.warn('Registration document warnings:', registrationValidation.warnings);
  }
  if (ownerIdValidation.warnings.length > 0) {
    console.warn('Owner ID document warnings:', ownerIdValidation.warnings);
  }

  try {
    // Upload documents to Cloudinary with validation metadata and individual error handling
    let registrationDocResult, ownerIdResult;
    
    try {
      registrationDocResult = await uploadDocumentToCloudinary(registrationDoc.buffer, registrationDoc.originalname, businessId, 'registration', registrationValidation.metadata);
    } catch (error) {
      console.error('Registration document upload failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload registration document. Please try again.',
        code: 'REGISTRATION_DOC_UPLOAD_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    try {
      ownerIdResult = await uploadDocumentToCloudinary(ownerId.buffer, ownerId.originalname, businessId, 'owner_id', ownerIdValidation.metadata);
    } catch (error) {
      console.error('Owner ID document upload failed:', error);
      // Rollback: Delete the already uploaded registration document
      try {
        await cloudinary.uploader.destroy(registrationDocResult.publicId);
        console.log('Rolled back registration document upload');
      } catch (rollbackError) {
        console.error('Failed to rollback registration document:', rollbackError);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to upload owner ID document. Please try again.',
        code: 'OWNER_ID_UPLOAD_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Prepare verification docs data for MongoDB
    const verificationDocsData = [
      registrationDocResult,
      ownerIdResult
    ];



    // Try a different approach - use the original business document and manually update
    const business = await BusinessProfile.findById(businessId);
    if (!business) {
      // Clean up uploaded files if business not found
      await Promise.all([
        cloudinary.uploader.destroy(registrationDocResult.publicId),
        cloudinary.uploader.destroy(ownerIdResult.publicId)
      ]);
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Update the business with direct assignment
    business.verificationDocs = verificationDocsData;
    business.verificationNotes = notes;
    business.verificationStatus = 'pending';
    business.lastVerificationSubmission = new Date();
    
    const savedBusiness = await business.save();

    // TODO: Send notification email to admin about new verification request
    
    res.status(200).json({ 
      success: true, 
      message: 'Documents uploaded successfully. Awaiting admin approval.',
      data: {
        business: {
          id: savedBusiness._id,
          name: business.businessName,
          verificationStatus: business.verificationStatus
        },
        documents: [registrationDocResult, ownerIdResult]
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload documents. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

module.exports = router;
