/**
 * Template processor utility for response templates
 */

/**
 * Process a template by replacing variables with actual values
 * @param {string} template - The template content with variables
 * @param {object} variables - Object containing variable values
 * @returns {string} - Processed template with variables replaced
 */
const processTemplate = async (template, variables = {}) => {
  if (!template || typeof template !== 'string') {
    return template;
  }

  let processed = template;

  // Replace all variables in the format {{variableName}}
  const variableRegex = /\{\{(\w+)\}\}/g;
  
  processed = processed.replace(variableRegex, (match, variableName) => {
    const value = variables[variableName];
    
    // Return the actual value if it exists, otherwise keep the placeholder
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    // For undefined variables, return empty string to avoid showing {{variableName}}
    return '';
  });

  // Clean up any extra spaces or newlines that might have been created
  processed = processed
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
    .replace(/^\s+|\s+$/g, ''); // Trim leading and trailing whitespace

  return processed;
};

/**
 * Extract variables from a template
 * @param {string} template - The template content
 * @returns {array} - Array of variable names found in template
 */
const extractVariables = (template) => {
  if (!template || typeof template !== 'string') {
    return [];
  }

  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const variableName = match[1];
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
};

/**
 * Validate that all required variables are provided
 * @param {string} template - The template content
 * @param {object} variables - Object containing variable values
 * @returns {object} - Validation result with success status and missing variables
 */
const validateTemplateVariables = (template, variables = {}) => {
  const requiredVariables = extractVariables(template);
  const missingVariables = [];

  requiredVariables.forEach(variable => {
    if (variables[variable] === undefined || variables[variable] === null) {
      missingVariables.push(variable);
    }
  });

  return {
    isValid: missingVariables.length === 0,
    requiredVariables,
    missingVariables,
    providedVariables: Object.keys(variables)
  };
};

/**
 * Get common template variables for business responses
 * @returns {object} - Object describing common variables
 */
const getCommonVariables = () => {
  return {
    customerName: {
      description: 'Name of the customer who left the review',
      example: 'John Smith',
      required: false,
      fallback: 'Valued Customer'
    },
    rating: {
      description: 'Star rating given by the customer (1-5)',
      example: '5',
      required: true,
      type: 'number'
    },
    reviewText: {
      description: 'The text content of the review',
      example: 'Great service and friendly staff!',
      required: true,
      type: 'string'
    },
    businessName: {
      description: 'Name of the business',
      example: 'ServisbetA Coffee Shop',
      required: true,
      type: 'string'
    },
    reviewDate: {
      description: 'Date when the review was posted',
      example: '12/25/2023',
      required: true,
      type: 'string'
    },
    responseDate: {
      description: 'Current date when responding',
      example: '12/26/2023',
      required: false,
      type: 'string',
      auto: true
    }
  };
};

/**
 * Generate sample template content with common variables
 * @param {string} category - Template category (positive, negative, neutral, etc.)
 * @returns {string} - Sample template content
 */
const generateSampleTemplate = (category = 'positive') => {
  const templates = {
    positive: `Dear {{customerName}},

Thank you so much for your wonderful {{rating}}-star review! We're thrilled to hear that you had a great experience at {{businessName}}.

Your feedback about "{{reviewText}}" means the world to us and motivates our team to continue providing excellent service.

We look forward to serving you again soon!

Best regards,
{{businessName}} Team`,

    negative: `Dear {{customerName}},

Thank you for taking the time to share your feedback about your experience at {{businessName}}.

We sincerely apologize that we didn't meet your expectations regarding "{{reviewText}}". Your {{rating}}-star rating helps us understand where we need to improve.

We would love the opportunity to make this right. Please contact us directly so we can address your concerns and improve your experience.

Best regards,
{{businessName}} Management`,

    neutral: `Dear {{customerName}},

Thank you for your {{rating}}-star review of {{businessName}}.

We appreciate you taking the time to share your thoughts: "{{reviewText}}". Your feedback helps us understand how we can better serve our customers.

If you have any additional suggestions or concerns, please don't hesitate to reach out to us directly.

Best regards,
{{businessName}} Team`,

    general: `Thank you {{customerName}} for your review!

We appreciate your {{rating}}-star rating and your feedback. Every review helps us improve our service at {{businessName}}.

Best regards,
The Team`
  };

  return templates[category] || templates.general;
};

module.exports = {
  processTemplate,
  extractVariables,
  validateTemplateVariables,
  getCommonVariables,
  generateSampleTemplate
};