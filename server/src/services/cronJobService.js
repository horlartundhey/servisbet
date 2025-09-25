const cron = require('node-cron');
const Review = require('../models/Review');
const Business = require('../models/Business');
const reviewNotificationService = require('./reviewNotificationService');

class CronJobService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all cron jobs
   */
  startJobs() {
    console.log('🕐 Starting cron jobs...');
    
    // Weekly review summary - Every Monday at 9 AM
    const weeklyJob = cron.schedule('0 9 * * 1', async () => {
      console.log('📊 Running weekly review summary job...');
      await this.sendWeeklyReviewSummaries();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Monthly cleanup - First day of month at 2 AM
    const cleanupJob = cron.schedule('0 2 1 * *', async () => {
      console.log('🧹 Running monthly cleanup job...');
      await this.monthlyCleanup();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Daily spam check - Every day at 3 AM
    const spamCheckJob = cron.schedule('0 3 * * *', async () => {
      console.log('🔍 Running daily spam check...');
      await this.dailySpamCheck();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.push(weeklyJob, cleanupJob, spamCheckJob);

    // Start all jobs
    this.jobs.forEach(job => job.start());
    
    console.log(`✅ Started ${this.jobs.length} cron jobs`);
  }

  /**
   * Stop all cron jobs
   */
  stopJobs() {
    this.jobs.forEach(job => job.destroy());
    this.jobs = [];
    console.log('🛑 Stopped all cron jobs');
  }

  /**
   * Send weekly review summaries to all business owners
   */
  async sendWeeklyReviewSummaries() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get all reviews from the past week
      const weeklyReviews = await Review.find({
        createdAt: { $gte: oneWeekAgo },
        status: 'published',
        $or: [
          { isVerified: true },
          { 'anonymousReviewer.isVerified': true }
        ]
      }).populate('business', 'name slug contactInfo owner');

      // Group reviews by business
      const reviewsByBusiness = weeklyReviews.reduce((acc, review) => {
        const businessId = review.business._id.toString();
        if (!acc[businessId]) {
          acc[businessId] = {
            business: review.business,
            reviews: []
          };
        }
        acc[businessId].reviews.push(review);
        return acc;
      }, {});

      let summariesSent = 0;
      
      // Send summary to each business with reviews
      for (const businessId in reviewsByBusiness) {
        const { business, reviews } = reviewsByBusiness[businessId];
        
        try {
          await reviewNotificationService.sendWeeklyReviewSummary(business, reviews);
          summariesSent++;
          
          // Add small delay to avoid overwhelming email service
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to send weekly summary to ${business.name}:`, error);
        }
      }

      console.log(`📧 Sent ${summariesSent} weekly review summaries`);
      
      // Log summary statistics
      console.log(`📊 Weekly Review Statistics:
        - Total reviews: ${weeklyReviews.length}
        - Businesses with reviews: ${Object.keys(reviewsByBusiness).length}
        - Summaries sent: ${summariesSent}
        - Average reviews per business: ${(weeklyReviews.length / Math.max(Object.keys(reviewsByBusiness).length, 1)).toFixed(1)}`);

    } catch (error) {
      console.error('Error in weekly review summary job:', error);
    }
  }

  /**
   * Monthly cleanup of old data
   */
  async monthlyCleanup() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Clean up old unverified anonymous reviews
      const oldUnverifiedResult = await Review.deleteMany({
        isAnonymous: true,
        'anonymousReviewer.isVerified': false,
        createdAt: { $lt: sixMonthsAgo },
        status: 'pending'
      });

      // Clean up old flagged spam reviews (keep for 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const spamCleanupResult = await Review.deleteMany({
        status: 'flagged',
        isSpam: true,
        createdAt: { $lt: threeMonthsAgo }
      });

      console.log(`🧹 Monthly cleanup completed:
        - Removed ${oldUnverifiedResult.deletedCount} old unverified reviews
        - Removed ${spamCleanupResult.deletedCount} old spam reviews`);

    } catch (error) {
      console.error('Error in monthly cleanup job:', error);
    }
  }

  /**
   * Daily spam check for reviews that need attention
   */
  async dailySpamCheck() {
    try {
      // Find reviews with high spam scores that aren't flagged yet
      const suspiciousReviews = await Review.find({
        spamScore: { $gte: 70 },
        status: { $ne: 'flagged' },
        isSpam: false
      }).populate('business', 'name');

      if (suspiciousReviews.length > 0) {
        // Flag them for manual review
        await Review.updateMany(
          { _id: { $in: suspiciousReviews.map(r => r._id) } },
          { 
            status: 'flagged',
            isSpam: true,
            spamReasons: ['High spam score detected by daily check']
          }
        );

        console.log(`🚨 Flagged ${suspiciousReviews.length} suspicious reviews for manual review`);
        
        // Send admin notification
        try {
          const adminEmail = process.env.ADMIN_EMAIL || 'horlartundhey@gmail.com';
          const subject = `🚨 Daily Spam Alert: ${suspiciousReviews.length} reviews flagged`;
          
          const reviewList = suspiciousReviews.map(review => 
            `- ${review.business.name}: ${review.spamScore}/100 spam score`
          ).join('\n');

          // You could expand this with a proper email template
          console.log(`Admin alert would be sent: ${subject}\n${reviewList}`);
          
        } catch (notificationError) {
          console.error('Failed to send admin spam alert:', notificationError);
        }
      }

    } catch (error) {
      console.error('Error in daily spam check job:', error);
    }
  }

  /**
   * Get status of all cron jobs
   */
  getJobStatus() {
    return {
      totalJobs: this.jobs.length,
      runningJobs: this.jobs.filter(job => job.running).length,
      status: this.jobs.length > 0 ? 'active' : 'inactive'
    };
  }

  /**
   * Manual trigger for testing (only in development)
   */
  async manualTrigger(jobName) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Manual triggers not allowed in production');
    }

    console.log(`🔧 Manually triggering job: ${jobName}`);

    switch (jobName) {
      case 'weekly-summary':
        await this.sendWeeklyReviewSummaries();
        break;
      case 'monthly-cleanup':
        await this.monthlyCleanup();
        break;
      case 'daily-spam':
        await this.dailySpamCheck();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

module.exports = new CronJobService();