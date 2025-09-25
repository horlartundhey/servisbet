const express = require('express');
const router = express.Router();
const {
  submitDispute,
  getMyDisputes,
  getDispute,
  addCommunication,
  updateEvidence,
  getAllDisputes,
  reviewDispute,
  escalateDispute
} = require('../controllers/disputeController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// All routes require authentication
router.use(verifyToken);

// Business owner routes
router.post('/', requireRole('business', 'admin'), submitDispute);
router.get('/my-disputes', requireRole('business', 'admin'), getMyDisputes);
router.get('/my-disputes/:businessId', requireRole('business', 'admin'), getMyDisputes);
router.get('/:id', getDispute); // Both business and admin
router.post('/:id/communicate', addCommunication); // Both business and admin
router.put('/:id/evidence', requireRole('business', 'admin'), updateEvidence);

// Admin-only routes
router.get('/admin/all', requireRole('admin'), getAllDisputes);
router.put('/:id/review', requireRole('admin'), reviewDispute);
router.put('/:id/escalate', requireRole('admin'), escalateDispute);

module.exports = router;