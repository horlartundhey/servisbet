const express = require('express');
const router = express.Router();
const bulkResponseController = require('../controllers/bulkResponseController');
const { verifyToken } = require('../middlewares/auth');
const businessAuth = require('../middlewares/businessAuth');

// All bulk response routes require authentication
router.use(verifyToken);

// Get eligible reviews for bulk response (registered users only)
router.get('/business/:businessId/eligible-reviews', 
  businessAuth, 
  bulkResponseController.getEligibleReviews
);

// Preview bulk response with template
router.post('/business/:businessId/preview', 
  businessAuth, 
  bulkResponseController.previewBulkResponse
);

// Submit bulk responses
router.post('/business/:businessId/submit', 
  businessAuth, 
  bulkResponseController.submitBulkResponses
);

// Get bulk response history
router.get('/business/:businessId/history', 
  businessAuth, 
  bulkResponseController.getBulkResponseHistory
);

// Schedule bulk responses for later
router.post('/business/:businessId/schedule', 
  businessAuth, 
  bulkResponseController.scheduleBulkResponses
);

// Get scheduled responses
router.get('/business/:businessId/scheduled', 
  businessAuth, 
  bulkResponseController.getScheduledResponses
);

// Cancel scheduled response
router.delete('/scheduled/:scheduleId', 
  bulkResponseController.cancelScheduledResponse
);

// Get response analytics
router.get('/business/:businessId/analytics', 
  businessAuth, 
  bulkResponseController.getResponseAnalytics
);

module.exports = router;