const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getBusinessReviews,
  getMyReviews,
  createReview,
  createAnonymousReview,
  verifyAnonymousReview,
  resendEmailVerification,
  getPendingVerificationReviews,
  updateReview,
  deleteReview,
  addBusinessResponse,
  markReviewHelpful,
  removeHelpfulMark
} = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middlewares/auth');
const { uploadReviewPhotos, uploadBusinessPhotos } = require('../config/upload');
const uploadErrorHandler = require('../middlewares/uploadErrorHandler');

// Public routes (no authentication required)
router.get('/', getAllReviews);
router.get('/business/:businessId', getBusinessReviews);
router.post('/anonymous', uploadReviewPhotos.array('photos', 5), uploadErrorHandler, createAnonymousReview);
router.get('/verify/:token', verifyAnonymousReview);
router.post('/resend-email-verification', resendEmailVerification);

// Photo upload routes (for testing)
router.post('/upload-photos', uploadReviewPhotos.array('photos', 5), uploadErrorHandler, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No photos uploaded'
    });
  }

  const uploadedImages = req.files.map(file => ({
    url: file.path,
    publicId: file.filename,
    width: file.width,
    height: file.height,
    format: file.format,
    size: file.bytes
  }));

  res.status(200).json({
    success: true,
    data: uploadedImages,
    message: `${uploadedImages.length} photo(s) uploaded successfully`
  });
});

// Protected routes
router.use(verifyToken); // All routes below require authentication

// User routes
router.get('/my-reviews', getMyReviews);
router.post('/', uploadReviewPhotos.array('photos', 5), uploadErrorHandler, requireRole('user'), createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markReviewHelpful);
router.delete('/:id/helpful', removeHelpfulMark);

// Admin routes
router.get('/pending-verification', requireRole('admin'), getPendingVerificationReviews);

// Business response routes
router.post('/:id/response', requireRole('business', 'admin'), addBusinessResponse);

module.exports = router;
