const express = require('express');
const router = express.Router();
const {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusinesses,
  getBusinessAnalytics
} = require('../controllers/businessController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public routes
router.get('/', getBusinesses);
router.get('/:id', getBusiness);

// Protected routes
router.use(verifyToken); // All routes below require authentication

router.get('/my/businesses', requireRole('business', 'admin'), getMyBusinesses);
router.post('/', requireRole('business', 'admin'), createBusiness);
router.put('/:id', updateBusiness);
router.delete('/:id', deleteBusiness);
router.get('/:id/analytics', getBusinessAnalytics);

module.exports = router;
