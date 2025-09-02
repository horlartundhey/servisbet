const express = require('express');
const router = express.Router();
const {
  getBusinessReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
  addBusinessResponse,
  markReviewHelpful,
  removeHelpfulMark
} = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public routes
router.get('/business/:businessId', getBusinessReviews);

// Protected routes
router.use(verifyToken); // All routes below require authentication

// User routes
router.get('/my-reviews', getMyReviews);
router.post('/', requireRole('user'), createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markReviewHelpful);
router.delete('/:id/helpful', removeHelpfulMark);

// Business response routes
router.post('/:id/response', requireRole('business', 'admin'), addBusinessResponse);

module.exports = router;
