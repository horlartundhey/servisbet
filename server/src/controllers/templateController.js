const ResponseTemplate = require('../models/ResponseTemplate');
const BusinessProfile = require('../models/BusinessProfile');
const Review = require('../models/Review');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Create response template
// @route   POST /api/templates
// @access  Private (Business owners only)
const createTemplate = asyncHandler(async (req, res) => {
  const {
    businessId,
    name,
    description,
    template,
    category,
    ratingRange,
    keywords,
    variables,
    autoApply,
    tags
  } = req.body;

  // Verify business ownership
  const business = await BusinessProfile.findOne({
    _id: businessId,
    owner: req.user.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found or not authorized'
    });
  }

  // Create the template
  const responseTemplate = await ResponseTemplate.create({
    owner: req.user.id,
    business: businessId,
    name,
    description,
    template,
    category,
    ratingRange,
    keywords: keywords || [],
    variables: variables || [],
    autoApply: autoApply || false,
    tags: tags || []
  });

  res.status(201).json({
    success: true,
    data: responseTemplate,
    message: 'Response template created successfully'
  });
});

// @desc    Get business templates
// @route   GET /api/templates/business/:businessId
// @access  Private (Business owners only)
const getBusinessTemplates = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  const { category, activeOnly = 'true' } = req.query;

  // Verify business ownership
  const business = await BusinessProfile.findOne({
    _id: businessId,
    owner: req.user.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found or not authorized'
    });
  }

  const templates = await ResponseTemplate.getBusinessTemplates(
    businessId,
    category,
    activeOnly === 'true'
  );

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Private (Business owners and shared users)
const getTemplate = asyncHandler(async (req, res) => {
  const template = await ResponseTemplate.findById(req.params.id)
    .populate('business', 'businessName')
    .populate('owner', 'firstName lastName');

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Check access permissions
  const hasAccess = 
    template.owner.toString() === req.user.id || // Owner
    template.isPublic || // Public template
    template.sharedWith.some(share => 
      share.business.toString() === req.user.businessId
    ); // Shared with user's business

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this template'
    });
  }

  res.status(200).json({
    success: true,
    data: template
  });
});

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private (Template owners only)
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await ResponseTemplate.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Check ownership
  if (template.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this template'
    });
  }

  const {
    name,
    description,
    template: templateContent,
    category,
    ratingRange,
    keywords,
    variables,
    isActive,
    isDefault,
    autoApply,
    tags,
    changeReason
  } = req.body;

  // If template content changed, create version
  if (templateContent && templateContent !== template.template) {
    await template.createVersion(templateContent, req.user.id, changeReason);
  } else {
    // Update other fields
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (category) template.category = category;
    if (ratingRange) template.ratingRange = ratingRange;
    if (keywords) template.keywords = keywords;
    if (variables) template.variables = variables;
    if (isActive !== undefined) template.isActive = isActive;
    if (isDefault !== undefined) template.isDefault = isDefault;
    if (autoApply !== undefined) template.autoApply = autoApply;
    if (tags) template.tags = tags;

    await template.save();
  }

  res.status(200).json({
    success: true,
    data: template,
    message: 'Template updated successfully'
  });
});

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private (Template owners only)
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await ResponseTemplate.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Check ownership
  if (template.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this template'
    });
  }

  await template.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Template deleted successfully'
  });
});

// @desc    Archive template
// @route   PUT /api/templates/:id/archive
// @access  Private (Template owners only)
const archiveTemplate = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const template = await ResponseTemplate.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Check ownership
  if (template.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to archive this template'
    });
  }

  await template.archive(reason);

  res.status(200).json({
    success: true,
    data: template,
    message: 'Template archived successfully'
  });
});

// @desc    Get suggested templates for review
// @route   GET /api/templates/suggestions/:businessId
// @access  Private (Business owners only)
const getSuggestedTemplates = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  const { rating, content } = req.query;

  // Verify business ownership
  const business = await BusinessProfile.findOne({
    _id: businessId,
    owner: req.user.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found or not authorized'
    });
  }

  const suggestions = await ResponseTemplate.findSuggestedTemplates(
    businessId,
    parseInt(rating),
    content
  );

  res.status(200).json({
    success: true,
    count: suggestions.length,
    data: suggestions
  });
});

// @desc    Process template with variables
// @route   POST /api/templates/:id/process
// @access  Private (Template owners and shared users)
const processTemplate = asyncHandler(async (req, res) => {
  const { variables } = req.body;

  const template = await ResponseTemplate.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Check access permissions
  const hasAccess = 
    template.owner.toString() === req.user.id ||
    template.isPublic ||
    template.sharedWith.some(share => 
      share.business.toString() === req.user.businessId
    );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to use this template'
    });
  }

  const processedContent = template.processTemplate(variables || {});

  // Increment usage counter
  await template.incrementUsage();

  res.status(200).json({
    success: true,
    data: {
      originalTemplate: template.template,
      processedContent,
      variables: template.variables,
      templateId: template._id
    }
  });
});

// @desc    Get public templates
// @route   GET /api/templates/public
// @access  Private
const getPublicTemplates = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;

  const templates = await ResponseTemplate.getPublicTemplates(category)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await ResponseTemplate.countDocuments({
    isPublic: true,
    isActive: true,
    isArchived: false,
    ...(category && { category })
  });

  res.status(200).json({
    success: true,
    count: templates.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: templates
  });
});

// @desc    Share template with business
// @route   POST /api/templates/:id/share
// @access  Private (Template owners only)
const shareTemplate = asyncHandler(async (req, res) => {
  const { businessId, permissions = 'view' } = req.body;

  const template = await ResponseTemplate.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Check ownership
  if (template.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to share this template'
    });
  }

  // Verify target business exists
  const targetBusiness = await BusinessProfile.findOne({
    _id: businessId,
    isActive: true
  });

  if (!targetBusiness) {
    return res.status(404).json({
      success: false,
      message: 'Target business not found'
    });
  }

  await template.shareWith(businessId, permissions);

  res.status(200).json({
    success: true,
    data: template,
    message: 'Template shared successfully'
  });
});

// @desc    Get template analytics
// @route   GET /api/templates/:id/analytics
// @access  Private (Template owners only)
const getTemplateAnalytics = asyncHandler(async (req, res) => {
  const template = await ResponseTemplate.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Check ownership
  if (template.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view template analytics'
    });
  }

  // Get usage over time (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // TODO: Implement more detailed analytics queries
  const analytics = {
    usage: template.usage,
    effectiveness: template.effectiveness,
    monthlyUsage: template.monthlyUsage,
    effectivenessScore: template.effectivenessScore,
    variables: template.variables.length,
    keywords: template.keywords.length,
    sharing: {
      isPublic: template.isPublic,
      sharedWithCount: template.sharedWith.length
    }
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});

module.exports = {
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
};