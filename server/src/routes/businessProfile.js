const express = require('express');
const router = express.Router();
const {
  getBusinessProfile,
  createOrUpdateBusinessProfile,
  updateBusinessDetails,
  updateBusinessImages,
  uploadVerificationDocuments,
  getCompletionStatus,
  deleteBusinessProfile
} = require('../controllers/businessProfileController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// All routes require authentication and business role
router.use(verifyToken);
router.use(requireRole('business'));

// Profile management
router.get('/', getBusinessProfile);
router.post('/', createOrUpdateBusinessProfile);
router.delete('/', deleteBusinessProfile);

// Step-specific updates
router.put('/details', updateBusinessDetails);
router.put('/images', updateBusinessImages);
router.put('/documents', uploadVerificationDocuments);

// Utility routes
router.get('/completion', getCompletionStatus);

module.exports = router;
