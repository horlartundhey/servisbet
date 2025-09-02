const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getBusinesses,
  updateBusinessStatus,
  getFlaggedReviews,
  moderateReview,
  getAnalytics
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

// Business management
router.get('/businesses', getBusinesses);
router.put('/businesses/:id/status', updateBusinessStatus);

// Review moderation
router.get('/reviews/flagged', getFlaggedReviews);
router.put('/reviews/:id/moderate', moderateReview);

module.exports = router;
