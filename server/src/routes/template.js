const express = require('express');
const router = express.Router();
const {
  createTemplate,
  getBusinessTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  archiveTemplate,
  getSuggestedTemplates,
  processTemplate,
  getPublicTemplates,
  shareTemplate,
  getTemplateAnalytics
} = require('../controllers/templateController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// All routes require authentication
router.use(verifyToken);

// Public templates (accessible to all authenticated users)
router.get('/public', getPublicTemplates);

// Business-specific templates
router.get('/business/:businessId', requireRole('business', 'admin'), getBusinessTemplates);
router.get('/suggestions/:businessId', requireRole('business', 'admin'), getSuggestedTemplates);

// CRUD operations
router.post('/', requireRole('business', 'admin'), createTemplate);
router.get('/:id', getTemplate);
router.put('/:id', requireRole('business', 'admin'), updateTemplate);
router.delete('/:id', requireRole('business', 'admin'), deleteTemplate);

// Template actions
router.put('/:id/archive', requireRole('business', 'admin'), archiveTemplate);
router.post('/:id/process', processTemplate);
router.post('/:id/share', requireRole('business', 'admin'), shareTemplate);
router.get('/:id/analytics', requireRole('business', 'admin'), getTemplateAnalytics);

module.exports = router;