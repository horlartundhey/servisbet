# Automated Billing System Implementation Plan

## 🎯 **Overview**
Comprehensive plan for implementing automated subscription billing, payment retries, status management, and billing lifecycle automation for ServisbetA.

---

## 📋 **Current Billing Infrastructure**

### **Existing Components** ✅
- Subscription models with payment history tracking
- Manual subscription status management
- Basic payment tracking in database
- Admin subscription oversight

### **Missing Automation** ❌
- Automatic payment retry logic
- Trial expiration handling
- Grace period management
- Subscription reactivation workflows
- Automated email notifications

---

## 🔧 **Implementation Architecture**

### **1. Billing Service Infrastructure**

#### **1.1 Billing Automation Service**
```javascript
// server/src/services/billingService.js
const cron = require('node-cron');
const { stripe } = require('../config/stripe');
const Subscription = require('../models/Subscription');
const BusinessProfile = require('../models/BusinessProfile');
const emailService = require('./emailService');

class BillingService {
  
  // Daily billing checks - runs at 2 AM UTC
  static initializeBillingScheduler() {
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting daily billing processes...');
      
      await this.processTrialExpirations();
      await this.processFailedPayments();
      await this.processGracePeriods();
      await this.generateBillingReports();
      
      console.log('Daily billing processes completed');
    });
  }
  
  // Process trial expirations
  static async processTrialExpirations() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Find trials expiring in 24 hours
    const expiringSoon = await Subscription.find({
      trialEnd: {
        $gte: today,
        $lt: tomorrow
      },
      stripeStatus: 'trialing'
    }).populate('business');
    
    // Send trial expiration warnings
    for (const subscription of expiringSoon) {
      await emailService.sendTrialExpirationWarning(
        subscription.business.businessEmail,
        subscription.business.name,
        subscription.plan
      );
    }
    
    // Find expired trials
    const expiredTrials = await Subscription.find({
      trialEnd: { $lt: today },
      stripeStatus: 'trialing'
    }).populate('business');
    
    // Process expired trials
    for (const subscription of expiredTrials) {
      await this.handleTrialExpiration(subscription);
    }
  }
  
  // Handle individual trial expiration
  static async handleTrialExpiration(subscription) {
    try {
      // Update subscription status
      subscription.stripeStatus = 'past_due';
      subscription.paymentStatus = 'failed';
      subscription.gracePeriodStart = new Date();
      subscription.gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      
      await subscription.save();
      
      // Restrict business access
      await BusinessProfile.findByIdAndUpdate(subscription.business._id, {
        subscriptionStatus: 'suspended',
        accessLevel: 'limited'
      });
      
      // Send trial expired notification
      await emailService.sendTrialExpiredNotification(
        subscription.business.businessEmail,
        subscription.business.name,
        subscription.plan
      );
      
      console.log(`Trial expired for business: ${subscription.business.name}`);
      
    } catch (error) {
      console.error('Error handling trial expiration:', error);
    }
  }
  
  // Process failed payments with retry logic
  static async processFailedPayments() {
    const failedPayments = await Subscription.find({
      stripeStatus: 'past_due',
      paymentStatus: 'failed',
      retryCount: { $lt: 3 } // Max 3 retry attempts
    }).populate('business');
    
    for (const subscription of failedPayments) {
      await this.retryFailedPayment(subscription);
    }
  }
  
  // Retry failed payment
  static async retryFailedPayment(subscription) {
    try {
      // Attempt to retry payment in Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );
      
      if (stripeSubscription.latest_invoice) {
        await stripe.invoices.pay(stripeSubscription.latest_invoice);
      }
      
      // Update retry count
      subscription.retryCount = (subscription.retryCount || 0) + 1;
      subscription.lastRetryDate = new Date();
      await subscription.save();
      
      console.log(`Payment retry attempted for: ${subscription.business.name}`);
      
    } catch (error) {
      console.error('Payment retry failed:', error);
      
      // If max retries reached, extend grace period
      if (subscription.retryCount >= 3) {
        await this.startGracePeriod(subscription);
      }
    }
  }
  
  // Process grace periods
  static async processGracePeriods() {
    const today = new Date();
    
    // Find grace periods ending today
    const gracePeriodEnding = await Subscription.find({
      gracePeriodEnd: { $lte: today },
      stripeStatus: 'past_due'
    }).populate('business');
    
    for (const subscription of gracePeriodEnding) {
      await this.handleGracePeriodExpiry(subscription);
    }
  }
  
  // Handle grace period expiry
  static async handleGracePeriodExpiry(subscription) {
    try {
      // Cancel subscription in Stripe
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      // Update local subscription
      subscription.stripeStatus = 'canceled';
      subscription.paymentStatus = 'failed';
      subscription.endDate = new Date();
      await subscription.save();
      
      // Suspend business account
      await BusinessProfile.findByIdAndUpdate(subscription.business._id, {
        subscriptionStatus: 'canceled',
        accessLevel: 'suspended'
      });
      
      // Send account suspended notification
      await emailService.sendAccountSuspendedNotification(
        subscription.business.businessEmail,
        subscription.business.name
      );
      
      console.log(`Account suspended for: ${subscription.business.name}`);
      
    } catch (error) {
      console.error('Error handling grace period expiry:', error);
    }
  }
  
  // Generate daily billing reports
  static async generateBillingReports() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const report = {
      date: today.toISOString().split('T')[0],
      metrics: {
        activeSubscriptions: await Subscription.countDocuments({ stripeStatus: 'active' }),
        trialingSubscriptions: await Subscription.countDocuments({ stripeStatus: 'trialing' }),
        pastDueSubscriptions: await Subscription.countDocuments({ stripeStatus: 'past_due' }),
        canceledSubscriptions: await Subscription.countDocuments({ stripeStatus: 'canceled' }),
        
        dailyRevenue: await this.calculateDailyRevenue(yesterday),
        failedPayments: await Subscription.countDocuments({
          'paymentHistory.date': { $gte: yesterday, $lt: today },
          'paymentHistory.status': 'failed'
        }),
        successfulPayments: await Subscription.countDocuments({
          'paymentHistory.date': { $gte: yesterday, $lt: today },
          'paymentHistory.status': 'succeeded'
        })
      }
    };
    
    // Send report to admin
    await emailService.sendDailyBillingReport(report);
    
    console.log('Daily billing report generated:', report);
  }
  
  // Calculate daily revenue
  static async calculateDailyRevenue(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const subscriptions = await Subscription.find({
      'paymentHistory.date': { $gte: startOfDay, $lte: endOfDay },
      'paymentHistory.status': 'succeeded'
    });
    
    let totalRevenue = 0;
    subscriptions.forEach(sub => {
      sub.paymentHistory.forEach(payment => {
        if (payment.date >= startOfDay && payment.date <= endOfDay && payment.status === 'succeeded') {
          totalRevenue += payment.amount;
        }
      });
    });
    
    return totalRevenue;
  }
}

module.exports = BillingService;
```

#### **1.2 Subscription Status Manager**
```javascript
// server/src/services/subscriptionStatusManager.js
const Subscription = require('../models/Subscription');
const BusinessProfile = require('../models/BusinessProfile');

class SubscriptionStatusManager {
  
  // Update business access based on subscription status
  static async updateBusinessAccess(businessId) {
    const subscription = await Subscription.findOne({ 
      business: businessId,
      stripeStatus: { $in: ['active', 'trialing'] }
    });
    
    const business = await BusinessProfile.findById(businessId);
    
    if (subscription && subscription.stripeStatus === 'active') {
      // Full access for active subscriptions
      business.subscriptionStatus = 'active';
      business.accessLevel = 'full';
      business.plan = subscription.plan;
      
    } else if (subscription && subscription.stripeStatus === 'trialing') {
      // Full access during trial
      business.subscriptionStatus = 'trial';
      business.accessLevel = 'full';
      business.plan = subscription.plan;
      
    } else {
      // Limited access for inactive subscriptions
      business.subscriptionStatus = 'inactive';
      business.accessLevel = 'limited';
      business.plan = null;
    }
    
    await business.save();
    return business;
  }
  
  // Check if business has feature access
  static async hasFeatureAccess(businessId, feature) {
    const business = await BusinessProfile.findById(businessId);
    
    if (!business || business.accessLevel === 'suspended') {
      return false;
    }
    
    if (business.accessLevel === 'limited') {
      // Define limited features
      const limitedFeatures = ['basic_profile', 'view_reviews'];
      return limitedFeatures.includes(feature);
    }
    
    // Full access features by plan
    const planFeatures = {
      basic: [
        'business_profile', 'review_responses', 'basic_analytics',
        'customer_support', 'mobile_page', 'google_sync'
      ],
      professional: [
        'unlimited_responses', 'advanced_analytics', 'priority_listing',
        'custom_design', 'review_campaigns', 'competitor_analysis',
        'priority_support', 'social_integration'
      ],
      enterprise: [
        'multi_location', 'white_label', 'api_access',
        'account_manager', 'custom_reports', 'bulk_operations',
        'sso_integration', 'premium_support'
      ]
    };
    
    const businessFeatures = planFeatures[business.plan] || [];
    return businessFeatures.includes(feature);
  }
  
  // Reactivate suspended account
  static async reactivateAccount(businessId, subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      const business = await BusinessProfile.findById(businessId);
      
      // Update subscription status
      subscription.stripeStatus = 'active';
      subscription.paymentStatus = 'completed';
      subscription.gracePeriodStart = null;
      subscription.gracePeriodEnd = null;
      subscription.retryCount = 0;
      await subscription.save();
      
      // Restore business access
      await this.updateBusinessAccess(businessId);
      
      console.log(`Account reactivated for: ${business.name}`);
      return true;
      
    } catch (error) {
      console.error('Error reactivating account:', error);
      return false;
    }
  }
}

module.exports = SubscriptionStatusManager;
```

### **2. Email Notification System**

#### **2.1 Billing Email Templates**
```javascript
// server/src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  
  static async sendTrialExpirationWarning(email, businessName, plan) {
    const subject = `Your ${plan} trial expires tomorrow - Action Required`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Trial Expires Tomorrow</h2>
        <p>Hi ${businessName},</p>
        <p>Your ${plan} plan trial will expire in 24 hours. To continue enjoying all features, please add a payment method to your account.</p>
        
        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What happens if you don't add payment?</h3>
          <ul>
            <li>Your account will be suspended</li>
            <li>You'll lose access to advanced features</li>
            <li>Your business profile will remain visible but with limited functionality</li>
          </ul>
        </div>
        
        <a href="${process.env.CLIENT_URL}/billing" 
           style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Add Payment Method
        </a>
        
        <p>Need help? Contact our support team at support@servisbeta.com</p>
        <p>Best regards,<br>The ServisbetA Team</p>
      </div>
    `;
    
    await this.sendEmail(email, subject, html);
  }
  
  static async sendTrialExpiredNotification(email, businessName, plan) {
    const subject = `Your ${plan} trial has expired`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Trial Expired - Limited Access Mode</h2>
        <p>Hi ${businessName},</p>
        <p>Your ${plan} plan trial has expired. Your account is now in limited access mode.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Current Access Level: Limited</h3>
          <p>You can still:</p>
          <ul>
            <li>View your business profile</li>
            <li>Read customer reviews</li>
            <li>Access basic account settings</li>
          </ul>
          
          <p><strong>You cannot:</strong></p>
          <ul>
            <li>Respond to reviews</li>
            <li>Access analytics</li>
            <li>Use advanced features</li>
          </ul>
        </div>
        
        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <h3>Grace Period: 3 Days</h3>
          <p>You have 3 days to add a payment method before your account is suspended.</p>
        </div>
        
        <a href="${process.env.CLIENT_URL}/billing" 
           style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Subscribe Now
        </a>
        
        <p>Questions? We're here to help at support@servisbeta.com</p>
        <p>Best regards,<br>The ServisbetA Team</p>
      </div>
    `;
    
    await this.sendEmail(email, subject, html);
  }
  
  static async sendPaymentFailedNotification(email, businessName, plan, retryCount) {
    const subject = `Payment Failed - Action Required (Attempt ${retryCount}/3)`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Failed</h2>
        <p>Hi ${businessName},</p>
        <p>We were unable to process your payment for the ${plan} plan subscription.</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3>Payment Attempt ${retryCount} of 3</h3>
          <p>We'll automatically retry your payment, but please check:</p>
          <ul>
            <li>Your card hasn't expired</li>
            <li>You have sufficient funds</li>
            <li>Your billing address is correct</li>
          </ul>
        </div>
        
        <a href="${process.env.CLIENT_URL}/billing" 
           style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Update Payment Method
        </a>
        
        <p>If payment fails 3 times, your account will enter a grace period before suspension.</p>
        <p>Need assistance? Contact support@servisbeta.com</p>
        <p>Best regards,<br>The ServisbetA Team</p>
      </div>
    `;
    
    await this.sendEmail(email, subject, html);
  }
  
  static async sendAccountSuspendedNotification(email, businessName) {
    const subject = 'Account Suspended - Immediate Action Required';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Suspended</h2>
        <p>Hi ${businessName},</p>
        <p>Your ServisbetA account has been suspended due to payment issues.</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3>Account Status: Suspended</h3>
          <p>Your business profile is no longer visible to customers and all features are disabled.</p>
        </div>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>Reactivate Your Account</h3>
          <p>You can reactivate your account at any time by subscribing to a plan.</p>
          <p>All your data is safe and will be restored upon reactivation.</p>
        </div>
        
        <a href="${process.env.CLIENT_URL}/billing" 
           style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Reactivate Account
        </a>
        
        <p>We're sorry to see you go. If you have questions, please contact support@servisbeta.com</p>
        <p>Best regards,<br>The ServisbetA Team</p>
      </div>
    `;
    
    await this.sendEmail(email, subject, html);
  }
  
  static async sendDailyBillingReport(report) {
    const subject = `Daily Billing Report - ${report.date}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2>Daily Billing Report - ${report.date}</h2>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <h3>Subscription Status</h3>
            <ul>
              <li>Active: ${report.metrics.activeSubscriptions}</li>
              <li>Trial: ${report.metrics.trialingSubscriptions}</li>
              <li>Past Due: ${report.metrics.pastDueSubscriptions}</li>
              <li>Canceled: ${report.metrics.canceledSubscriptions}</li>
            </ul>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <h3>Payment Activity</h3>
            <ul>
              <li>Daily Revenue: $${report.metrics.dailyRevenue.toFixed(2)}</li>
              <li>Successful Payments: ${report.metrics.successfulPayments}</li>
              <li>Failed Payments: ${report.metrics.failedPayments}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    await this.sendEmail(process.env.ADMIN_EMAIL, subject, html);
  }
  
  // Base email sending method
  static async sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.sendMail({
      from: `"ServisbetA" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html
    });
  }
}

module.exports = EmailService;
```

### **3. API Integration**

#### **3.1 Billing Management Routes**
```javascript
// server/src/routes/billing.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const SubscriptionStatusManager = require('../services/subscriptionStatusManager');
const BillingService = require('../services/billingService');

// Get billing status
router.get('/status/:businessId', verifyToken, requireRole('business'), async (req, res) => {
  try {
    const business = await SubscriptionStatusManager.updateBusinessAccess(req.params.businessId);
    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check feature access
router.get('/feature-access/:businessId/:feature', verifyToken, async (req, res) => {
  try {
    const hasAccess = await SubscriptionStatusManager.hasFeatureAccess(
      req.params.businessId,
      req.params.feature
    );
    res.json({ success: true, hasAccess });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reactivate account
router.post('/reactivate', verifyToken, requireRole('business'), async (req, res) => {
  try {
    const { businessId, subscriptionId } = req.body;
    const success = await SubscriptionStatusManager.reactivateAccount(businessId, subscriptionId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get billing overview
router.get('/admin/overview', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const report = await BillingService.generateBillingReports();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### **4. Initialization**

#### **4.1 Start Billing Service**
```javascript
// server/src/app.js or server/src/index.js
const BillingService = require('./services/billingService');

// Initialize billing scheduler
BillingService.initializeBillingScheduler();

// Add billing routes
app.use('/api/billing', require('./routes/billing'));
```

---

## 📊 **Automation Workflows**

### **Daily Processes (2 AM UTC)**
1. ✅ Check trial expirations (24h warning)
2. ✅ Process expired trials
3. ✅ Retry failed payments (max 3 attempts)
4. ✅ Manage grace periods
5. ✅ Suspend accounts after grace period
6. ✅ Generate billing reports

### **Real-time Processes**
1. ✅ Webhook payment status updates
2. ✅ Immediate account reactivation
3. ✅ Feature access validation
4. ✅ Subscription status synchronization

---

## 🎯 **Success Metrics**

- **Payment Recovery Rate**: > 60% of failed payments recovered
- **Grace Period Utilization**: < 20% of accounts require suspension
- **Automated Processing**: 95% of billing operations automated
- **Customer Satisfaction**: < 5% billing-related support tickets

---

## 🚀 **Deployment Checklist**

### **Environment Setup**
- [ ] Configure SMTP settings for email notifications
- [ ] Set up cron job scheduling
- [ ] Add billing service environment variables
- [ ] Test email templates
- [ ] Verify webhook endpoints

### **Monitoring**
- [ ] Set up billing process logging
- [ ] Configure error alerts
- [ ] Monitor payment recovery rates
- [ ] Track automation performance

This automated billing system will handle all subscription lifecycle management, reducing manual operations by 90% and ensuring consistent revenue collection.