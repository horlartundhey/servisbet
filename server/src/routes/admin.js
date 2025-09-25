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
const cronJobService = require('../services/cronJobService');
const asyncHandler = require('../middlewares/asyncHandler');

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

// Cron job management
router.get('/cron/status', asyncHandler(async (req, res) => {
  const status = cronJobService.getJobStatus();
  
  res.status(200).json({
    success: true,
    data: {
      ...status,
      serverInfo: {
        environment: process.env.NODE_ENV || 'development',
        isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
        timezone: 'UTC'
      },
      availableJobs: [
        'weekly-summary',
        'monthly-cleanup',
        'daily-spam'
      ]
    },
    message: 'Cron job status retrieved successfully'
  });
}));

router.post('/cron/trigger/:jobName', asyncHandler(async (req, res) => {
  const { jobName } = req.params;
  
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Manual job triggers are not allowed in production environment'
    });
  }
  
  const validJobs = ['weekly-summary', 'monthly-cleanup', 'daily-spam'];
  
  if (!validJobs.includes(jobName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid job name. Valid options: ${validJobs.join(', ')}`
    });
  }
  
  try {
    await cronJobService.manualTrigger(jobName);
    
    res.status(200).json({
      success: true,
      message: `Job '${jobName}' triggered successfully`,
      data: {
        jobName,
        triggeredAt: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Failed to trigger job '${jobName}': ${error.message}`
    });
  }
}));

module.exports = router;
