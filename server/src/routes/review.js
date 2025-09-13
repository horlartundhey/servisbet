const express = require('express');
const router = express.Router();
const {
  getBusinessReviews,
  getMyReviews,
  createReview,
  createAnonymousReview,
  verifyAnonymousReview,
  getPendingVerificationReviews,
  updateReview,
  deleteReview,
  addBusinessResponse,
  markReviewHelpful,
  removeHelpfulMark
} = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public routes (no authentication required)
router.get('/business/:businessId', getBusinessReviews);
router.post('/anonymous', createAnonymousReview);
router.get('/verify/:token', verifyAnonymousReview);

// Protected routes
router.use(verifyToken); // All routes below require authentication

// User routes
router.get('/my-reviews', getMyReviews);
router.post('/', requireRole('user'), createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markReviewHelpful);
router.delete('/:id/helpful', removeHelpfulMark);

// Admin routes
router.get('/pending-verification', requireRole('admin'), getPendingVerificationReviews);

// Business response routes
router.post('/:id/response', requireRole('business', 'admin'), addBusinessResponse);

module.exports = router;
