const ResponseTemplate = require('../models/ResponseTemplate');
const Business = require('../models/Business');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all response templates for a business
// @route   GET /api/response-templates
// @access  Private (Business owner)
const getResponseTemplates = asyncHandler(async (req, res) => {
  const { category, rating, isActive = true } = req.query;
  const userId = req.user.id;

  // Get business ID from user's businesses
  const business = await Business.findOne({ owner: userId });
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  const templates = await ResponseTemplate.getTemplatesForBusiness(business._id, {
    category,
    rating: rating ? parseInt(rating) : undefined,
    isActive: isActive === 'true'
  });

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

// @desc    Get suggested templates for a specific review
// @route   GET /api/response-templates/suggestions/:reviewId
// @access  Private (Business owner)
const getSuggestedTemplates = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  // Get business and verify ownership
  const business = await Business.findOne({ owner: userId });
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Get the review to analyze
  const Review = require('../models/Review');
  const review = await Review.findById(reviewId);
  if (!review || review.business.toString() !== business._id.toString()) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or unauthorized'
    });
  }

  const suggestedTemplates = await ResponseTemplate.getSuggestedTemplates(business._id, review);

  res.status(200).json({
    success: true,
    count: suggestedTemplates.length,
    data: suggestedTemplates,
    review: {
      rating: review.rating,
      content: review.content.substring(0, 200)
    }
  });
});

// @desc    Create new response template
// @route   POST /api/response-templates
// @access  Private (Business owner)
const createResponseTemplate = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    content,
    category,
    ratingRange,
    variables,
    isDefault
  } = req.body;

  // Get business and verify ownership
  const business = await Business.findOne({ owner: userId });
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  const template = await ResponseTemplate.create({
    owner: userId,
    business: business._id,
    name,
    content,
    category,
    ratingRange,
    variables,
    isDefault
  });

  await template.populate('owner', 'firstName lastName');

  res.status(201).json({
    success: true,
    data: template,
    message: 'Response template created successfully'
  });
});

// @desc    Update response template
// @route   PUT /api/response-templates/:id
// @access  Private (Business owner)
const updateResponseTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const template = await ResponseTemplate.findById(id);
  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Verify ownership
  if (template.owner.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to update this template'
    });
  }

  const updatedTemplate = await ResponseTemplate.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  ).populate('owner', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: updatedTemplate,
    message: 'Template updated successfully'
  });
});

// @desc    Delete response template
// @route   DELETE /api/response-templates/:id
// @access  Private (Business owner)
const deleteResponseTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const template = await ResponseTemplate.findById(id);
  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Verify ownership
  if (template.owner.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to delete this template'
    });
  }

  await ResponseTemplate.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Template deleted successfully'
  });
});

// @desc    Use template for review response
// @route   POST /api/response-templates/:id/use
// @access  Private (Business owner)
const useTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variables, reviewId } = req.body;
  const userId = req.user.id;

  const template = await ResponseTemplate.findById(id);
  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Verify ownership
  if (template.owner.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to use this template'
    });
  }

  // Render template with variables
  const renderedContent = template.renderTemplate(variables);

  // Increment usage count
  await template.incrementUsage();

  // If reviewId provided, create the actual response
  if (reviewId) {
    const reviewController = require('./reviewController');
    
    // Use existing review response functionality
    req.body = {
      content: renderedContent
    };
    req.params = { id: reviewId };
    
    return reviewController.addBusinessResponse(req, res);
  }

  res.status(200).json({
    success: true,
    data: {
      templateId: template._id,
      renderedContent,
      originalTemplate: template.content
    },
    message: 'Template rendered successfully'
  });
});

// @desc    Get default templates by category
// @route   GET /api/response-templates/defaults
// @access  Private (Business owner)
const getDefaultTemplates = asyncHandler(async (req, res) => {
  const { category, rating } = req.query;

  // These are system-wide default templates that all businesses can use
  const defaultTemplates = [
    // Appreciation Templates (4-5 stars)
    {
      _id: 'default_appreciation_1',
      name: 'Thank You - General',
      content: 'Thank you so much for your wonderful review, {{customerName}}! We\'re thrilled to hear you had a great experience with us. Your feedback means the world to our team, and we look forward to serving you again soon!',
      category: 'appreciation',
      ratingRange: { min: 4, max: 5 },
      variables: [{ name: 'customerName', placeholder: 'valued customer', required: false }],
      isDefault: true
    },
    {
      _id: 'default_appreciation_2',
      name: 'Thank You - Specific Service',
      content: 'Hi {{customerName}}, thank you for the fantastic {{rating}}-star review! We\'re so happy that {{specificService}} exceeded your expectations. Your kind words motivate us to keep delivering excellent service. We can\'t wait to see you again!',
      category: 'appreciation',
      ratingRange: { min: 4, max: 5 },
      variables: [
        { name: 'customerName', placeholder: 'valued customer', required: false },
        { name: 'rating', placeholder: '5', required: false },
        { name: 'specificService', placeholder: 'our service', required: false }
      ],
      isDefault: true
    },

    // Apology Templates (1-2 stars)
    {
      _id: 'default_apology_1',
      name: 'Sincere Apology',
      content: 'Dear {{customerName}}, we sincerely apologize for the disappointing experience you had with us. This does not reflect our usual standards, and we take your feedback very seriously. Please contact us at {{contactInfo}} so we can make this right. Thank you for bringing this to our attention.',
      category: 'apology',
      ratingRange: { min: 1, max: 2 },
      variables: [
        { name: 'customerName', placeholder: 'valued customer', required: false },
        { name: 'contactInfo', placeholder: 'our customer service', required: true }
      ],
      isDefault: true
    },
    {
      _id: 'default_apology_2',
      name: 'Apology with Action Plan',
      content: 'Hello {{customerName}}, thank you for your honest feedback. We\'re truly sorry that we didn\'t meet your expectations. We\'ve reviewed your concerns with our team and have implemented {{improvements}} to prevent this from happening again. We\'d love the opportunity to welcome you back and show you the improvements we\'ve made.',
      category: 'apology',
      ratingRange: { min: 1, max: 3 },
      variables: [
        { name: 'customerName', placeholder: 'valued customer', required: false },
        { name: 'improvements', placeholder: 'several improvements', required: false }
      ],
      isDefault: true
    },

    // Improvement Templates (2-3 stars)
    {
      _id: 'default_improvement_1',
      name: 'Working on It',
      content: 'Hi {{customerName}}, thank you for your feedback. We appreciate you taking the time to share your experience. We\'re constantly working to improve {{areaOfImprovement}}, and your input helps us identify areas where we can do better. We hope to have the chance to serve you again and show you the improvements we\'ve made!',
      category: 'improvement',
      ratingRange: { min: 2, max: 4 },
      variables: [
        { name: 'customerName', placeholder: 'valued customer', required: false },
        { name: 'areaOfImprovement', placeholder: 'our services', required: false }
      ],
      isDefault: true
    },

    // General Templates (All ratings)
    {
      _id: 'default_general_1',
      name: 'General Response',
      content: 'Thank you for taking the time to leave us a review, {{customerName}}! We value all feedback from our customers as it helps us continue to improve. If you have any additional comments or suggestions, please don\'t hesitate to reach out to us directly.',
      category: 'general',
      ratingRange: { min: 1, max: 5 },
      variables: [
        { name: 'customerName', placeholder: 'valued customer', required: false }
      ],
      isDefault: true
    }
  ];

  let filteredTemplates = defaultTemplates;

  if (category) {
    filteredTemplates = defaultTemplates.filter(t => t.category === category);
  }

  if (rating) {
    const ratingNum = parseInt(rating);
    filteredTemplates = filteredTemplates.filter(t => 
      t.ratingRange.min <= ratingNum && t.ratingRange.max >= ratingNum
    );
  }

  res.status(200).json({
    success: true,
    count: filteredTemplates.length,
    data: filteredTemplates
  });
});

// @desc    Get template categories and their descriptions
// @route   GET /api/response-templates/categories
// @access  Private (Business owner)
const getTemplateCategories = asyncHandler(async (req, res) => {
  const categories = [
    {
      value: 'appreciation',
      label: 'Appreciation',
      description: 'Thank customers for positive reviews',
      recommendedRatings: [4, 5],
      color: 'green'
    },
    {
      value: 'apology',
      label: 'Apology',
      description: 'Apologetic responses for negative reviews',
      recommendedRatings: [1, 2],
      color: 'red'
    },
    {
      value: 'improvement',
      label: 'Improvement',
      description: 'Acknowledge feedback and mention improvements',
      recommendedRatings: [2, 3, 4],
      color: 'yellow'
    },
    {
      value: 'clarification',
      label: 'Clarification',
      description: 'Ask for more details or clarify misunderstandings',
      recommendedRatings: [1, 2, 3],
      color: 'blue'
    },
    {
      value: 'invitation',
      label: 'Invitation',
      description: 'Invite customers to return or contact directly',
      recommendedRatings: [1, 2, 3, 4, 5],
      color: 'purple'
    },
    {
      value: 'general',
      label: 'General',
      description: 'Generic responses suitable for any review',
      recommendedRatings: [1, 2, 3, 4, 5],
      color: 'gray'
    }
  ];

  res.status(200).json({
    success: true,
    data: categories
  });
});

module.exports = {
  getResponseTemplates,
  getSuggestedTemplates,
  createResponseTemplate,
  updateResponseTemplate,
  deleteResponseTemplate,
  useTemplate,
  getDefaultTemplates,
  getTemplateCategories
};