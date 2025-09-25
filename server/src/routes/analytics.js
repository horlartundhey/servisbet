const express = require('express');
const router = express.Router();
const { getBusinessAnalytics } = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Get comprehensive analytics for a business
router.get('/business/:businessId', verifyToken, requireRole('business', 'admin'), getBusinessAnalytics);

module.exports = router;