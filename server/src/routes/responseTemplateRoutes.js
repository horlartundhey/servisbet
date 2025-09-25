const express = require('express');
const {
  getResponseTemplates,
  getSuggestedTemplates,
  createResponseTemplate,
  updateResponseTemplate,
  deleteResponseTemplate,
  useTemplate,
  getDefaultTemplates,
  getTemplateCategories
} = require('../controllers/responseTemplateController');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Template management routes
router.route('/')
  .get(getResponseTemplates)      // GET /api/response-templates
  .post(createResponseTemplate);  // POST /api/response-templates

router.route('/categories')
  .get(getTemplateCategories);    // GET /api/response-templates/categories

router.route('/defaults')
  .get(getDefaultTemplates);      // GET /api/response-templates/defaults

router.route('/suggestions/:reviewId')
  .get(getSuggestedTemplates);    // GET /api/response-templates/suggestions/:reviewId

router.route('/:id')
  .put(updateResponseTemplate)    // PUT /api/response-templates/:id
  .delete(deleteResponseTemplate); // DELETE /api/response-templates/:id

router.route('/:id/use')
  .post(useTemplate);             // POST /api/response-templates/:id/use

module.exports = router;