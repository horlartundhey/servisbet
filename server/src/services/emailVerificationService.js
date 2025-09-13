const nodemailer = require('nodemailer');

class EmailVerificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send email verification for anonymous review
   * @param {Object} reviewData - The review data
   * @param {string} verificationToken - The verification token
   * @param {Object} businessData - The business information
   */
  async sendAnonymousReviewVerification(reviewData, verificationToken, businessData) {
    const baseUrl = process.env.CLIENT_URL || 'https://servisbet-client-git-main-horlartundheys-projects.vercel.app';
    const verificationUrl = `${baseUrl}/verify-review?token=${verificationToken}&reviewId=${reviewData._id}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Review - ServisbetA</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF1744, #FF5722); color: white; text-align: center; padding: 30px 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
              .review-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .stars { color: #FFD700; font-size: 18px; margin: 10px 0; }
              .button { display: inline-block; background: #FF1744; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Thanks for Your Review!</h1>
                  <p>Please verify your email to publish your review</p>
              </div>
              <div class="content">
                  <p>Hi <strong>${reviewData.anonymousReviewer.name}</strong>,</p>
                  
                  <p>Thank you for taking the time to review <strong>${businessData.name}</strong>! To help maintain the quality and authenticity of our reviews, please verify your email address.</p>
                  
                  <div class="review-card">
                      <h3>Your Review Preview:</h3>
                      <div class="stars">${'★'.repeat(reviewData.rating)}${'☆'.repeat(5 - reviewData.rating)}</div>
                      <p><strong>${reviewData.title || 'Review'}</strong></p>
                      <p>${reviewData.content}</p>
                      <p><small>Review for: ${businessData.name}</small></p>
                  </div>
                  
                  <center>
                      <a href="${verificationUrl}" class="button">Verify Email & Publish Review</a>
                  </center>
                  
                  <p><strong>Why do we need email verification?</strong></p>
                  <ul>
                      <li>Prevents spam and fake reviews</li>
                      <li>Ensures review authenticity</li>
                      <li>Allows business owners to respond to genuine feedback</li>
                      <li>Maintains trust in our review system</li>
                  </ul>
                  
                  <p><strong>Note:</strong> This verification link will expire in 24 hours. If you didn't request this review, you can safely ignore this email.</p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  
                  <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #FF1744;">${verificationUrl}</p>
              </div>
              <div class="footer">
                  <p>This email was sent by ServisbetA | <a href="${baseUrl}">Visit our website</a></p>
                  <p>© ${new Date().getFullYear()} ServisbetA. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const textContent = `
      Thanks for Your Review!

      Hi ${reviewData.anonymousReviewer.name},

      Thank you for reviewing ${businessData.name}! Please verify your email to publish your review.

      Your Review:
      Rating: ${reviewData.rating}/5 stars
      ${reviewData.title ? `Title: ${reviewData.title}` : ''}
      Review: ${reviewData.content}

      Verify your email by visiting this link:
      ${verificationUrl}

      This link will expire in 24 hours.

      Why email verification?
      - Prevents spam and fake reviews
      - Ensures review authenticity
      - Maintains trust in our platform

      If you didn't request this review, please ignore this email.

      Best regards,
      The ServisbetA Team
      ${baseUrl}
    `;

    const mailOptions = {
      from: `"ServisbetA Reviews" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: reviewData.anonymousReviewer.email,
      subject: `Verify Your Review for ${businessData.name} - ServisbetA`,
      text: textContent,
      html: htmlContent
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send confirmation email after successful verification
   * @param {Object} reviewData - The verified review data
   * @param {Object} businessData - The business information
   */
  async sendReviewPublishedConfirmation(reviewData, businessData) {
    const baseUrl = process.env.CLIENT_URL || 'https://servisbet-client-git-main-horlartundheys-projects.vercel.app';
    const reviewUrl = `${baseUrl}/business/${businessData.slug}#review-${reviewData._id}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Review Published - ServisbetA</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4CAF50, #8BC34A); color: white; text-align: center; padding: 30px 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
              .success-badge { background: #4CAF50; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 10px 0; }
              .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>✅ Review Published Successfully!</h1>
                  <div class="success-badge">Thank you ${reviewData.anonymousReviewer.name}!</div>
              </div>
              <div class="content">
                  <p>Great news! Your review for <strong>${businessData.name}</strong> has been successfully published on ServisbetA.</p>
                  
                  <center>
                      <a href="${reviewUrl}" class="button">View Your Published Review</a>
                  </center>
                  
                  <p><strong>What happens next?</strong></p>
                  <ul>
                      <li>Your review is now live and visible to other customers</li>
                      <li>The business owner may respond to your review</li>
                      <li>Other customers can find your review helpful</li>
                      <li>You're contributing to a trustworthy review ecosystem</li>
                  </ul>
                  
                  <p>Thank you for helping other customers make informed decisions!</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"ServisbetA Reviews" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: reviewData.anonymousReviewer.email,
      subject: `Your Review is Now Live! - ServisbetA`,
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent to:', reviewData.anonymousReviewer.email);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't throw error here as it's not critical
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailVerificationService();