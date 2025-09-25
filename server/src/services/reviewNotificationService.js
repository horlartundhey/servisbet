const nodemailer = require('nodemailer');
const Business = require('../models/Business');
const User = require('../models/User');

class ReviewNotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send notification to business owner about new review
   * @param {Object} review - The review object
   * @param {Object} business - The business object
   */
  async sendNewReviewNotification(review, business) {
    try {
      // Get business owner email
      let businessOwnerEmail = business.contactInfo?.email || business.owner?.email;
      
      if (!businessOwnerEmail && business.owner) {
        const owner = await User.findById(business.owner).select('email name');
        businessOwnerEmail = owner?.email;
      }

      if (!businessOwnerEmail) {
        console.log(`No email found for business owner of ${business.name}`);
        return;
      }

      const reviewerName = review.isAnonymous 
        ? review.anonymousReviewer.name 
        : review.user?.name || 'A customer';

      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const baseUrl = process.env.CLIENT_URL || 'https://servisbet-client-git-main-horlartundheys-projects.vercel.app';
      const businessUrl = `${baseUrl}/business/${business.slug || business._id}`;

      const subject = review.rating >= 4 
        ? `🎉 New ${review.rating}-Star Review for ${business.name}!`
        : `📝 New ${review.rating}-Star Review for ${business.name}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Review - ServisbetA</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #FF1744, #FF5722); color: white; text-align: center; padding: 30px 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
                .review-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid ${review.rating >= 4 ? '#4CAF50' : review.rating >= 3 ? '#FF9800' : '#FF1744'}; }
                .stars { color: #FFD700; font-size: 20px; margin: 10px 0; }
                .rating-badge { display: inline-block; background: ${review.rating >= 4 ? '#4CAF50' : review.rating >= 3 ? '#FF9800' : '#FF1744'}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
                .business-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; background: #FF1744; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                .photos { display: flex; gap: 10px; margin: 15px 0; flex-wrap: wrap; }
                .photo { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${review.rating >= 4 ? '🌟' : '📝'} New Review Received!</h1>
                    <p>Someone left a review for your business</p>
                </div>
                <div class="content">
                    <div class="business-info">
                        <h2>📍 ${business.name}</h2>
                        <p><strong>Current Rating:</strong> ${business.averageRating ? business.averageRating.toFixed(1) : 'New'} ⭐ (${business.reviewCount || 0} reviews)</p>
                    </div>
                    
                    <div class="review-card">
                        <div class="rating-badge">${review.rating}/5 Rating</div>
                        <div class="stars">${stars}</div>
                        
                        <h3>👤 Review by: ${reviewerName}</h3>
                        ${review.title ? `<h4>"${review.title}"</h4>` : ''}
                        
                        <p><strong>📝 Review:</strong></p>
                        <p style="background: #fff; padding: 15px; border-radius: 8px; border-left: 4px solid #ddd;">${review.content}</p>
                        
                        ${review.images && review.images.length > 0 ? `
                            <p><strong>📷 Photos attached:</strong></p>
                            <div class="photos">
                                ${review.images.slice(0, 3).map(img => `<img src="${img.url}" alt="Review photo" class="photo">`).join('')}
                                ${review.images.length > 3 ? `<p>+${review.images.length - 3} more photos</p>` : ''}
                            </div>
                        ` : ''}
                        
                        <p><strong>📅 Submitted:</strong> ${new Date(review.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        
                        <p><strong>🔗 Source:</strong> ${review.isAnonymous ? 'Anonymous review' : 'Registered user review'}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${businessUrl}" class="button">View Full Business Profile</a>
                    </div>
                    
                    ${review.rating <= 2 ? `
                        <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
                            <h3>⚠️ Low Rating Alert</h3>
                            <p>This review has a low rating. Consider responding professionally to address any concerns and show that you value customer feedback.</p>
                        </div>
                    ` : ''}
                    
                    <h3>💡 What You Can Do:</h3>
                    <ul>
                        <li><strong>Respond:</strong> Reply to the review professionally</li>
                        <li><strong>Learn:</strong> Use feedback to improve your services</li>
                        <li><strong>Engage:</strong> Thank customers for positive feedback</li>
                        <li><strong>Follow up:</strong> Address any issues mentioned in the review</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>This notification was sent because you own <strong>${business.name}</strong> on ServisbetA.</p>
                    <p>© ${new Date().getFullYear()} ServisbetA. All rights reserved.</p>
                    <p>Building trust through transparency 🤝</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"ServisbetA Reviews" <${process.env.EMAIL_USER}>`,
        to: businessOwnerEmail,
        subject: subject,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`New review notification sent to ${businessOwnerEmail} for business: ${business.name}`);
      return result;

    } catch (error) {
      console.error('Error sending new review notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to admin about new review
   * @param {Object} review - The review object
   * @param {Object} business - The business object
   */
  async sendAdminReviewNotification(review, business) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'horlartundhey@gmail.com';
      const reviewerName = review.isAnonymous 
        ? `${review.anonymousReviewer.name} (${review.anonymousReviewer.email})` 
        : review.user?.name || 'Unknown user';

      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const baseUrl = process.env.CLIENT_URL || 'https://servisbet-client-git-main-horlartundheys-projects.vercel.app';
      const businessUrl = `${baseUrl}/business/${business.slug || business._id}`;
      const adminUrl = `${baseUrl}/admin/reviews`;

      const subject = `📊 New Review: ${review.rating}⭐ for ${business.name}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin: New Review - ServisbetA</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
                .review-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0; }
                .stat { background: white; padding: 15px; text-align: center; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .alert { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .button { display: inline-block; background: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Admin Alert: New Review</h1>
                    <p>Review monitoring dashboard</p>
                </div>
                <div class="content">
                    <div class="stats">
                        <div class="stat">
                            <h3>${review.rating}/5</h3>
                            <p>Rating</p>
                        </div>
                        <div class="stat">
                            <h3>${review.isAnonymous ? 'Anonymous' : 'Registered'}</h3>
                            <p>Review Type</p>
                        </div>
                        <div class="stat">
                            <h3>${business.reviewCount || 0}</h3>
                            <p>Total Reviews</p>
                        </div>
                    </div>
                    
                    <div class="review-card">
                        <h3>📍 Business: ${business.name}</h3>
                        <p><strong>👤 Reviewer:</strong> ${reviewerName}</p>
                        <p><strong>⭐ Rating:</strong> ${stars} (${review.rating}/5)</p>
                        ${review.title ? `<p><strong>📝 Title:</strong> ${review.title}</p>` : ''}
                        <p><strong>💬 Content:</strong></p>
                        <p style="background: #f9f9f9; padding: 15px; border-radius: 8px;">${review.content}</p>
                        
                        ${review.images && review.images.length > 0 ? `
                            <p><strong>📷 Photos:</strong> ${review.images.length} attached</p>
                        ` : ''}
                        
                        <p><strong>🕐 Submitted:</strong> ${new Date(review.createdAt).toLocaleString()}</p>
                        <p><strong>🌐 IP:</strong> ${review.ipAddress || 'Unknown'}</p>
                        <p><strong>📱 User Agent:</strong> ${review.userAgent ? review.userAgent.substring(0, 50) + '...' : 'Unknown'}</p>
                    </div>
                    
                    ${review.rating <= 2 ? `
                        <div class="alert">
                            <h4>⚠️ Low Rating Alert</h4>
                            <p>This review has a rating of ${review.rating}/5. You may want to monitor for business response and customer service follow-up.</p>
                        </div>
                    ` : ''}
                    
                    ${review.isSpam ? `
                        <div class="alert">
                            <h4>🚨 Spam Alert</h4>
                            <p>This review was flagged as potential spam with score: ${review.spamScore}/100</p>
                            <p><strong>Reasons:</strong> ${review.spamReasons ? review.spamReasons.join(', ') : 'Automatic detection'}</p>
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${adminUrl}" class="button">View Admin Dashboard</a>
                        <a href="${businessUrl}" class="button">View Business Page</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"ServisbetA Admin" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: subject,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Admin review notification sent for: ${business.name}`);
      return result;

    } catch (error) {
      console.error('Error sending admin review notification:', error);
      throw error;
    }
  }

  /**
   * Send weekly review summary to business owners
   * @param {Object} business - The business object
   * @param {Array} weeklyReviews - Reviews from the past week
   */
  async sendWeeklyReviewSummary(business, weeklyReviews) {
    try {
      if (weeklyReviews.length === 0) return;

      let businessOwnerEmail = business.contactInfo?.email || business.owner?.email;
      
      if (!businessOwnerEmail && business.owner) {
        const owner = await User.findById(business.owner).select('email name');
        businessOwnerEmail = owner?.email;
      }

      if (!businessOwnerEmail) return;

      const avgRating = weeklyReviews.reduce((sum, review) => sum + review.rating, 0) / weeklyReviews.length;
      const highRatings = weeklyReviews.filter(r => r.rating >= 4).length;
      const lowRatings = weeklyReviews.filter(r => r.rating <= 2).length;

      const subject = `📊 Weekly Review Summary for ${business.name} (${weeklyReviews.length} new reviews)`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Weekly Review Summary - ServisbetA</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #FF1744, #FF5722); color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
                .stat { background: white; padding: 15px; text-align: center; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .reviews { margin: 20px 0; }
                .review { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ddd; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Weekly Review Summary</h1>
                    <p>${business.name}</p>
                </div>
                <div class="content">
                    <div class="stats">
                        <div class="stat">
                            <h3>${weeklyReviews.length}</h3>
                            <p>New Reviews</p>
                        </div>
                        <div class="stat">
                            <h3>${avgRating.toFixed(1)}</h3>
                            <p>Avg Rating</p>
                        </div>
                        <div class="stat">
                            <h3>${highRatings}</h3>
                            <p>High Ratings (4-5⭐)</p>
                        </div>
                        <div class="stat">
                            <h3>${lowRatings}</h3>
                            <p>Low Ratings (1-2⭐)</p>
                        </div>
                    </div>
                    
                    <h3>Recent Reviews:</h3>
                    <div class="reviews">
                        ${weeklyReviews.slice(0, 5).map(review => `
                            <div class="review">
                                <p><strong>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</strong> by ${review.isAnonymous ? review.anonymousReviewer.name : review.user?.name || 'Anonymous'}</p>
                                <p>${review.content}</p>
                                <small>${new Date(review.createdAt).toLocaleDateString()}</small>
                            </div>
                        `).join('')}
                        ${weeklyReviews.length > 5 ? `<p><em>... and ${weeklyReviews.length - 5} more reviews</em></p>` : ''}
                    </div>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"ServisbetA Weekly Report" <${process.env.EMAIL_USER}>`,
        to: businessOwnerEmail,
        subject: subject,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Weekly summary sent to ${businessOwnerEmail} for ${business.name}`);

    } catch (error) {
      console.error('Error sending weekly review summary:', error);
    }
  }
}

module.exports = new ReviewNotificationService();