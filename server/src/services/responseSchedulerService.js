const cron = require('node-cron');
const Review = require('../models/Review');
const BusinessProfile = require('../models/BusinessProfile');
const ResponseTemplate = require('../models/ResponseTemplate');
const { processTemplate } = require('../utils/templateProcessor');

// In-memory store for scheduled responses (in production, use Redis or database)
const scheduledResponses = new Map();

const responseSchedulerService = {
  // Schedule responses to be sent at a specific time
  scheduleResponses: async (businessId, responses, scheduledTime, templateId, customVariables = {}) => {
    try {
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const scheduledData = {
        id: scheduleId,
        businessId,
        responses,
        templateId,
        customVariables,
        scheduledTime: new Date(scheduledTime),
        status: 'pending',
        createdAt: new Date()
      };

      scheduledResponses.set(scheduleId, scheduledData);
      
      // Calculate cron schedule (convert to UTC)
      const scheduleDate = new Date(scheduledTime);
      const cronExpression = `${scheduleDate.getMinutes()} ${scheduleDate.getHours()} ${scheduleDate.getDate()} ${scheduleDate.getMonth() + 1} *`;
      
      // Schedule the job
      cron.schedule(cronExpression, async () => {
        await this.executeScheduledResponses(scheduleId);
      }, {
        timezone: "UTC"
      });

      return {
        success: true,
        scheduleId,
        scheduledTime: scheduleDate,
        responseCount: responses.length
      };
    } catch (error) {
      console.error('Error scheduling responses:', error);
      throw error;
    }
  },

  // Execute scheduled responses
  executeScheduledResponses: async (scheduleId) => {
    try {
      const scheduledData = scheduledResponses.get(scheduleId);
      if (!scheduledData) {
        console.error('Scheduled response not found:', scheduleId);
        return;
      }

      scheduledData.status = 'executing';
      scheduledResponses.set(scheduleId, scheduledData);

      const { businessId, responses, templateId, customVariables } = scheduledData;

      // Get business and template
      const business = await BusinessProfile.findById(businessId);
      const template = await ResponseTemplate.findById(templateId);

      if (!business || !template) {
        scheduledData.status = 'failed';
        scheduledData.error = 'Business or template not found';
        scheduledResponses.set(scheduleId, scheduledData);
        return;
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each scheduled response
      for (const response of responses) {
        try {
          const { reviewId, customResponse } = response;

          const review = await Review.findOne({
            _id: reviewId,
            businessId: businessId,
            user: { $exists: true, $ne: null },
            $or: [
              { anonymous: false },
              { anonymous: { $exists: false } }
            ],
            businessResponse: { $exists: false }
          }).populate('user', 'name email verified');

          if (!review) {
            results.failed.push({
              reviewId,
              error: 'Review not found or not eligible'
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
            respondedBy: business.owner,
            isScheduled: true,
            scheduleId: scheduleId
          };

          await review.save();

          // Update template usage statistics
          await ResponseTemplate.findByIdAndUpdate(templateId, {
            $inc: { 
              'analytics.usage.totalUses': 1,
              'analytics.usage.scheduledUses': 1
            }
          });

          results.successful.push({
            reviewId,
            customerName: review.user?.name || 'Valued Customer',
            rating: review.rating
          });

        } catch (error) {
          console.error(`Error processing scheduled response for review ${response.reviewId}:`, error);
          results.failed.push({
            reviewId: response.reviewId,
            error: error.message || 'Processing error'
          });
        }
      }

      // Update scheduled data status
      scheduledData.status = 'completed';
      scheduledData.results = results;
      scheduledData.completedAt = new Date();
      scheduledResponses.set(scheduleId, scheduledData);

      console.log(`Completed scheduled responses ${scheduleId}:`, {
        successful: results.successful.length,
        failed: results.failed.length
      });

    } catch (error) {
      console.error('Error executing scheduled responses:', error);
      
      const scheduledData = scheduledResponses.get(scheduleId);
      if (scheduledData) {
        scheduledData.status = 'failed';
        scheduledData.error = error.message;
        scheduledResponses.set(scheduleId, scheduledData);
      }
    }
  },

  // Get scheduled responses for a business
  getScheduledResponses: async (businessId, userId) => {
    try {
      const businessSchedules = [];
      
      for (const [scheduleId, data] of scheduledResponses.entries()) {
        if (data.businessId === businessId) {
          // Verify business ownership
          const business = await BusinessProfile.findById(businessId);
          if (business && business.owner.toString() === userId) {
            businessSchedules.push({
              id: scheduleId,
              scheduledTime: data.scheduledTime,
              responseCount: data.responses.length,
              status: data.status,
              templateName: data.templateId ? await this.getTemplateName(data.templateId) : 'Unknown',
              createdAt: data.createdAt,
              completedAt: data.completedAt,
              results: data.results
            });
          }
        }
      }

      return businessSchedules.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting scheduled responses:', error);
      throw error;
    }
  },

  // Cancel scheduled response
  cancelScheduledResponse: async (scheduleId, userId) => {
    try {
      const scheduledData = scheduledResponses.get(scheduleId);
      if (!scheduledData) {
        throw new Error('Scheduled response not found');
      }

      // Verify business ownership
      const business = await BusinessProfile.findById(scheduledData.businessId);
      if (!business || business.owner.toString() !== userId) {
        throw new Error('Not authorized to cancel this scheduled response');
      }

      if (scheduledData.status !== 'pending') {
        throw new Error('Can only cancel pending scheduled responses');
      }

      scheduledData.status = 'cancelled';
      scheduledData.cancelledAt = new Date();
      scheduledResponses.set(scheduleId, scheduledData);

      return {
        success: true,
        message: 'Scheduled response cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling scheduled response:', error);
      throw error;
    }
  },

  // Helper method to get template name
  getTemplateName: async (templateId) => {
    try {
      const template = await ResponseTemplate.findById(templateId);
      return template ? template.name : 'Unknown Template';
    } catch (error) {
      return 'Unknown Template';
    }
  },

  // Get analytics for response scheduling
  getSchedulingAnalytics: async (businessId, userId) => {
    try {
      // Verify business ownership
      const business = await BusinessProfile.findById(businessId);
      if (!business || business.owner.toString() !== userId) {
        throw new Error('Not authorized for this business');
      }

      const businessSchedules = Array.from(scheduledResponses.values())
        .filter(data => data.businessId === businessId);

      const analytics = {
        totalScheduled: businessSchedules.length,
        pending: businessSchedules.filter(s => s.status === 'pending').length,
        completed: businessSchedules.filter(s => s.status === 'completed').length,
        failed: businessSchedules.filter(s => s.status === 'failed').length,
        cancelled: businessSchedules.filter(s => s.status === 'cancelled').length,
        totalResponsesSent: businessSchedules
          .filter(s => s.results)
          .reduce((sum, s) => sum + s.results.successful.length, 0),
        averageResponsesPerSchedule: businessSchedules.length > 0 ? 
          businessSchedules
            .filter(s => s.results)
            .reduce((sum, s) => sum + s.results.successful.length, 0) / businessSchedules.length : 0,
        mostActiveHours: this.getMostActiveSchedulingHours(businessSchedules),
        recentActivity: businessSchedules
          .filter(s => s.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .length
      };

      return analytics;
    } catch (error) {
      console.error('Error getting scheduling analytics:', error);
      throw error;
    }
  },

  // Get most active hours for scheduling
  getMostActiveSchedulingHours: (schedules) => {
    const hourCounts = new Array(24).fill(0);
    
    schedules.forEach(schedule => {
      const hour = schedule.scheduledTime.getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    const mostActiveHour = hourCounts.indexOf(maxCount);

    return {
      hour: mostActiveHour,
      count: maxCount,
      distribution: hourCounts
    };
  },

  // Initialize scheduler service
  initialize: () => {
    console.log('Response Scheduler Service initialized');
    
    // Clean up old completed/failed schedules periodically (keep for 30 days)
    cron.schedule('0 2 * * *', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      for (const [scheduleId, data] of scheduledResponses.entries()) {
        if ((data.status === 'completed' || data.status === 'failed') && 
            data.createdAt < thirtyDaysAgo) {
          scheduledResponses.delete(scheduleId);
        }
      }
      
      console.log('Cleaned up old scheduled responses');
    });
  }
};

module.exports = responseSchedulerService;