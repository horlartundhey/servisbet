const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      console.log('🔧 Initializing email service...');
      console.log(`📧 Email Host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
      console.log(`👤 Email User: ${process.env.EMAIL_USER}`);
      
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Connection timeouts
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
      });

      // Test the connection
      await this.testConnection();
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.error('📧 Email will not be available, but registration will still work');
      this.transporter = null;
    }
  }

  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }
    
    try {
      console.log('🔍 Testing email connection...');
      await this.transporter.verify();
      console.log('✅ Email service is ready and verified');
      return { success: true };
    } catch (error) {
      console.error('❌ Email service verification failed:', error.message);
      throw error;
    }
  }

  // Send email with retry mechanism
  async sendEmailWithRetry(mailOptions, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Sending email (attempt ${attempt}/${maxRetries}) to: ${mailOptions.to}`);
        console.log(`📝 Subject: ${mailOptions.subject}`);
        
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log(`📩 Message ID: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } catch (error) {
        console.error(`❌ Email send attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        const delay = attempt * 2000; // 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Send verification email
  async sendVerificationEmail(email, firstName, verificationToken) {
    if (!this.transporter) {
      console.log('⚠️ Email service not available, trying to reinitialize...');
      await this.initializeTransporter();
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }
    }

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Servisbeta" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Servisbeta Account',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Servisbeta!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>

              <p>Thank you for registering with Servisbeta. To complete your registration and start using our platform, please verify your email address.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
              
              <p><strong>This verification link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
              
              <p>Best regards,<br>The Servisbeta Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to ${email}. If you have any questions, contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      return await this.sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}:`, error.message);
      
      // Return specific error information
      if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed. Please contact support.');
      } else {
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, firstName, resetToken) {
    if (!this.transporter) {
      console.log('⚠️ Email service not available, trying to reinitialize...');
      await this.initializeTransporter();
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"ServisbetA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your ServisbetA Password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              
              <p>We received a request to reset your password for your ServisbetA account.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${resetUrl}</p>
              
              <p><strong>This password reset link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>Best regards,<br>The ServisbetA Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to ${email}. If you have any questions, contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      return await this.sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error(`❌ Failed to send password reset email to ${email}:`, error.message);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  // Send business verification reminder
  async sendBusinessVerificationReminder(email, firstName) {
    if (!this.transporter) {
      console.log('⚠️ Email service not available, trying to reinitialize...');
      await this.initializeTransporter();
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }
    }

    const dashboardUrl = `${process.env.CLIENT_URL}/business-dashboard`;
    
    const mailOptions = {
      from: `"ServisbetA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Complete Your Business Profile - ServisbetA',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Business Profile</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Complete Your Business Profile</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              
              <p>Welcome to ServisbetA! We're excited to have you as a business partner.</p>
              
              <p>To start receiving reviews and building your online reputation, please complete your business profile verification.</p>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Complete Profile</a>
              </div>
              
              <p>Your business profile helps customers find and trust your services. The verification process typically takes just a few minutes.</p>
              
              <p>Best regards,<br>The ServisbetA Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to ${email}. If you have any questions, contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      return await this.sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error(`❌ Failed to send business verification reminder to ${email}:`, error.message);
      throw new Error(`Failed to send business verification reminder: ${error.message}`);
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;