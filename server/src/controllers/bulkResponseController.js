const Review = require('../models/Review');
const BusinessProfile = require('../models/BusinessProfile');
const ResponseTemplate = require('../models/ResponseTemplate');
const { processTemplate } = require('../utils/templateProcessor');
const responseSchedulerService = require('../services/responseSchedulerService');

const bulkResponseController = {
  // Get eligible reviews for bulk response (registered users only)
  getEligibleReviews: async (req, res) => {
    try {
      const { businessId } = req.params;
      const { 
        filter = 'all',
        rating = 'all',
        sortBy = 'newest',
        limit = 50 
      } = req.query;

      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (business.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this business' });
      }

      // Build query for registered users only (exclude anonymous)
      let query = {
        businessId: businessId,
        // Only reviews with user accounts (registered users)
        user: { $exists: true, $ne: null },
        // Exclude anonymous reviews
        $or: [
          { anonymous: false },
          { anonymous: { $exists: false } }
        ]
      };

      // Apply filters
      if (filter === 'unresponded') {
        query.businessResponse = { $exists: false };
      } else if (filter === 'responded') {
        query.businessResponse = { $exists: true };
      }

      if (rating !== 'all') {
        const ratingFilter = parseInt(rating);
        if (ratingFilter >= 1 && ratingFilter <= 5) {
          query.rating = ratingFilter;
        }
      }

      // Build sort criteria
      let sortCriteria = { createdAt: -1 }; // Default: newest first
      if (sortBy === 'oldest') {
        sortCriteria = { createdAt: 1 };
      } else if (sortBy === 'rating_low') {
        sortCriteria = { rating: 1, createdAt: -1 };
      } else if (sortBy === 'rating_high') {
        sortCriteria = { rating: -1, createdAt: -1 };
      }

      const reviews = await Review.find(query)
        .populate('user', 'name email verified')
        .sort(sortCriteria)
        .limit(parseInt(limit));

      // Calculate summary statistics
      const totalRegistered = await Review.countDocuments({
        businessId: businessId,
        user: { $exists: true, $ne: null },
        $or: [
          { anonymous: false },
          { anonymous: { $exists: false } }
        ]
      });

      const unresponded = await Review.countDocuments({
        businessId: businessId,
        user: { $exists: true, $ne: null },
        $or: [
          { anonymous: false },
          { anonymous: { $exists: false } }
        ],
        businessResponse: { $exists: false }
      });

      const summary = {
        totalRegistered,
        unresponded,
        responded: totalRegistered - unresponded,
        filtered: reviews.length
      };

      res.json({
        success: true,
        reviews,
        summary,
        business: {
          id: business._id,
          name: business.businessName
        }
      });

    } catch (error) {
      console.error('Error getting eligible reviews:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Preview bulk response with template
  previewBulkResponse: async (req, res) => {
    try {
      const { businessId } = req.params;
      const { templateId, reviewIds, customVariables = {} } = req.body;

      if (!templateId || !reviewIds || !Array.isArray(reviewIds)) {
        return res.status(400).json({ error: 'Template ID and review IDs are required' });
      }

      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (business.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this business' });
      }

      // Get template
      const template = await ResponseTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Verify template access
      if (template.businessId.toString() !== businessId && !template.isPublic) {
        return res.status(403).json({ error: 'Template not accessible' });
      }

      // Get eligible reviews (registered users only)
      const reviews = await Review.find({
        _id: { $in: reviewIds },
        businessId: businessId,
        user: { $exists: true, $ne: null },
        $or: [
          { anonymous: false },
          { anonymous: { $exists: false } }
        ]
      }).populate('user', 'name email verified');

      if (reviews.length === 0) {
        return res.status(400).json({ error: 'No eligible reviews found' });
      }

      // Process template for each review
      const previews = await Promise.all(reviews.map(async (review) => {
        const variables = {
          customerName: review.user?.name || 'Valued Customer',
          rating: review.rating,
          reviewText: review.text,
          businessName: business.businessName,
          reviewDate: review.createdAt.toLocaleDateString(),
          ...customVariables
        };

        const processedResponse = await processTemplate(template.content, variables);

        return {
          reviewId: review._id,
          customerName: review.user?.name || 'Valued Customer',
          rating: review.rating,
          reviewText: review.text.substring(0, 150) + (review.text.length > 150 ? '...' : ''),
          processedResponse,
          canRespond: !review.businessResponse // Only allow if not already responded
        };
      }));

      res.json({
        success: true,
        template: {
          id: template._id,
          name: template.name,
          content: template.content
        },
        previews,
        summary: {
          total: reviews.length,
          canRespond: previews.filter(p => p.canRespond).length,
          alreadyResponded: previews.filter(p => !p.canRespond).length
        }
      });

    } catch (error) {
      console.error('Error previewing bulk response:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Submit bulk responses
  submitBulkResponses: async (req, res) => {
    try {
      const { businessId } = req.params;
      const { templateId, responses, customVariables = {} } = req.body;

      if (!templateId || !responses || !Array.isArray(responses)) {
        return res.status(400).json({ error: 'Template ID and responses are required' });
      }

      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (business.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this business' });
      }

      // Get template
      const template = await ResponseTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each response
      for (const response of responses) {
        try {
          const { reviewId, customResponse } = response;

          // Get review and verify eligibility
          const review = await Review.findOne({
            _id: reviewId,
            businessId: businessId,
            user: { $exists: true, $ne: null },
            $or: [
              { anonymous: false },
              { anonymous: { $exists: false } }
            ],
            businessResponse: { $exists: false } // Only unresponded reviews
          }).populate('user', 'name email verified');

          if (!review) {
            results.failed.push({
              reviewId,
              error: 'Review not found or not eligible for response'
            });
            continue;
          }

          // Process response content
          let responseContent;
          if (customResponse && customResponse.trim()) {
            responseContent = customResponse;
          } else {
            const variables = {
              customerName: review.user?.name || 'Valued Customer',
              rating: review.rating,
              reviewText: review.text,
              businessName: business.businessName,
              reviewDate: review.createdAt.toLocaleDateString(),
              ...customVariables
            };
            responseContent = await processTemplate(template.content, variables);
          }

          // Update review with business response
          review.businessResponse = {
            text: responseContent,
            respondedAt: new Date(),
            respondedBy: req.user.id
          };

          await review.save();

          // Update template usage statistics
          if (template.businessId.toString() === businessId) {
            await ResponseTemplate.findByIdAndUpdate(templateId, {
              $inc: { 'analytics.usage.totalUses': 1 }
            });
          }

          results.successful.push({
            reviewId,
            customerName: review.user?.name || 'Valued Customer',
            rating: review.rating
          });

        } catch (error) {
          console.error(`Error processing response for review ${response.reviewId}:`, error);
          results.failed.push({
            reviewId: response.reviewId,
            error: error.message || 'Processing error'
          });
        }
      }

      res.json({
        success: true,
        results,
        summary: {
          total: responses.length,
          successful: results.successful.length,
          failed: results.failed.length
        },
        template: {
          id: template._id,
          name: template.name
        }
      });

    } catch (error) {
      console.error('Error submitting bulk responses:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get bulk response history
  getBulkResponseHistory: async (req, res) => {
    try {
      const { businessId } = req.params;
      const { 
        limit = 20,
        page = 1,
        templateId = null,
        startDate = null,
        endDate = null
      } = req.query;

      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (business.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this business' });
      }

      // Build date filter
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter['businessResponse.respondedAt'] = {};
        if (startDate) {
          dateFilter['businessResponse.respondedAt']['$gte'] = new Date(startDate);
        }
        if (endDate) {
          dateFilter['businessResponse.respondedAt']['$lte'] = new Date(endDate);
        }
      }

      // Get responded reviews
      let query = {
        businessId: businessId,
        user: { $exists: true, $ne: null },
        $or: [
          { anonymous: false },
          { anonymous: { $exists: false } }
        ],
        'businessResponse': { $exists: true },
        ...dateFilter
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const history = await Review.find(query)
        .populate('user', 'name email verified')
        .populate('businessResponse.respondedBy', 'name email')
        .sort({ 'businessResponse.respondedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments(query);

      // Group by response date and template if possible
      const groupedHistory = history.reduce((acc, review) => {
        const responseDate = review.businessResponse.respondedAt.toDateString();
        
        if (!acc[responseDate]) {
          acc[responseDate] = [];
        }
        
        acc[responseDate].push({
          reviewId: review._id,
          customerName: review.user?.name || 'Valued Customer',
          rating: review.rating,
          reviewText: review.text.substring(0, 100) + (review.text.length > 100 ? '...' : ''),
          responseText: review.businessResponse.text.substring(0, 100) + 
                       (review.businessResponse.text.length > 100 ? '...' : ''),
          respondedAt: review.businessResponse.respondedAt,
          respondedBy: review.businessResponse.respondedBy?.name || 'Unknown'
        });
        
        return acc;
      }, {});

      res.json({
        success: true,
        history: groupedHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        business: {
          id: business._id,
          name: business.businessName
        }
      });

    } catch (error) {
      console.error('Error getting bulk response history:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Schedule bulk responses for later
  scheduleBulkResponses: async (req, res) => {
    try {
      const { businessId } = req.params;
      const { templateId, responses, scheduledTime, customVariables = {} } = req.body;

      if (!templateId || !responses || !Array.isArray(responses) || !scheduledTime) {
        return res.status(400).json({ error: 'Template ID, responses, and scheduled time are required' });
      }

      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }

      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (business.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this business' });
      }

      // Get template
      const template = await ResponseTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Validate responses are eligible
      const reviewIds = responses.map(r => r.reviewId);
      const eligibleReviews = await Review.find({
        _id: { $in: reviewIds },
        businessId: businessId,
        user: { $exists: true, $ne: null },
        $or: [
          { anonymous: false },
          { anonymous: { $exists: false } }
        ],
        businessResponse: { $exists: false }
      });

      if (eligibleReviews.length === 0) {
        return res.status(400).json({ error: 'No eligible reviews found for scheduling' });
      }

      // Schedule the responses
      const scheduleResult = await responseSchedulerService.scheduleResponses(
        businessId,
        responses.filter(r => eligibleReviews.some(er => er._id.toString() === r.reviewId)),
        scheduledTime,
        templateId,
        customVariables
      );

      res.json({
        success: true,
        ...scheduleResult,
        template: {
          id: template._id,
          name: template.name
        },
        business: {
          id: business._id,
          name: business.businessName
        }
      });

    } catch (error) {
      console.error('Error scheduling bulk responses:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get scheduled responses for a business
  getScheduledResponses: async (req, res) => {
    try {
      const { businessId } = req.params;

      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (business.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this business' });
      }

      const scheduledResponses = await responseSchedulerService.getScheduledResponses(businessId, req.user.id);

      res.json({
        success: true,
        scheduledResponses,
        business: {
          id: business._id,
          name: business.businessName
        }
      });

    } catch (error) {
      console.error('Error getting scheduled responses:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Cancel scheduled response
  cancelScheduledResponse: async (req, res) => {
    try {
      const { scheduleId } = req.params;

      const result = await responseSchedulerService.cancelScheduledResponse(scheduleId, req.user.id);

      res.json(result);

    } catch (error) {
      console.error('Error cancelling scheduled response:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  // Get response analytics
  getResponseAnalytics: async (req, res) => {
    try {
      const { businessId } = req.params;

      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (business.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this business' });
      }

      // Get scheduling analytics
      const schedulingAnalytics = await responseSchedulerService.getSchedulingAnalytics(businessId, req.user.id);

      // Get template usage analytics
      const templates = await ResponseTemplate.find({
        $or: [
          { businessId: businessId },
          { isPublic: true }
        ]
      }).select('name analytics category');

      // Get response statistics
      const totalResponses = await Review.countDocuments({
        businessId: businessId,
        businessResponse: { $exists: true }
      });

      const scheduledResponses = await Review.countDocuments({
        businessId: businessId,
        'businessResponse.isScheduled': true
      });

      const responseRate = await Review.aggregate([
        { $match: { businessId: business._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            responded: { $sum: { $cond: ['$businessResponse', 1, 0] } }
          }
        },
        {
          $project: {
            responseRate: { $multiply: [{ $divide: ['$responded', '$total'] }, 100] }
          }
        }
      ]);

      const analytics = {
        responses: {
          total: totalResponses,
          scheduled: scheduledResponses,
          manual: totalResponses - scheduledResponses,
          responseRate: responseRate[0]?.responseRate || 0
        },
        scheduling: schedulingAnalytics,
        templates: templates.map(template => ({
          id: template._id,
          name: template.name,
          category: template.category,
          usage: template.analytics?.usage || { totalUses: 0, scheduledUses: 0 },
          effectiveness: template.analytics?.effectiveness || { averageRating: 0, positiveResponses: 0 }
        }))
      };

      res.json({
        success: true,
        analytics,
        business: {
          id: business._id,
          name: business.businessName
        }
      });

    } catch (error) {
      console.error('Error getting response analytics:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = bulkResponseController;