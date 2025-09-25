const express = require('express');
const router = express.Router();
const {
  getBusinesses,
  getBusiness,
  createBusiness,
  createAdditionalBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusinesses,
  getMyPrimaryBusiness,
  setPrimaryBusiness,
  getBusinessBySlug,
  getBusinessAnalytics
} = require('../controllers/businessController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public routes
router.get('/', getBusinesses);
router.get('/slug/:slug', getBusinessBySlug); // Get business by slug
router.get('/:id', getBusiness);

// Protected routes
router.use(verifyToken); // All routes below require authentication

// Multi-business management routes
router.get('/my/businesses', requireRole('business', 'admin'), getMyBusinesses);
router.get('/my/primary', requireRole('business', 'admin'), getMyPrimaryBusiness);
router.post('/create-additional', requireRole('business', 'admin'), createAdditionalBusiness);
router.put('/:id/set-primary', requireRole('business', 'admin'), setPrimaryBusiness);

// Standard CRUD routes
router.post('/', requireRole('business', 'admin'), createBusiness);
router.put('/:id', updateBusiness);
router.delete('/:id', deleteBusiness);
router.get('/:id/analytics', getBusinessAnalytics);

module.exports = router;
