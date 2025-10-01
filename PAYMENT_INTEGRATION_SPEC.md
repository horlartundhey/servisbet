# Payment Integration Technical Specification

## 🎯 **Overview**
Comprehensive technical guide for implementing Stripe payment gateway integration into the existing ServisbetA subscription system.

---

## 📋 **Current State Analysis**

### **Existing Infrastructure** ✅
- Subscription models in place (`server/src/models/Subscription.js`)
- Subscription API endpoints (`server/src/routes/subscription.js`)
- Frontend subscription UI (`client/src/pages/Pricing.tsx`)
- User role management (business subscription logic)

### **Missing Components** ❌
- Payment gateway integration
- Webhook handling
- Automated billing logic
- Payment failure management

---

## 🔧 **Technical Implementation Plan**

### **Phase 1: Backend Payment Infrastructure**

#### **1.1 Environment Setup**
```bash
# Install required packages
cd server
npm install stripe dotenv
```

#### **1.2 Environment Variables**
```env
# Add to server/.env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_1ABC...
STRIPE_PRICE_PROFESSIONAL=price_1DEF...
STRIPE_PRICE_ENTERPRISE=price_1GHI...
```

#### **1.3 Stripe Configuration**
```javascript
// server/src/config/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STRIPE_PRICES = {
  basic_monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
  basic_annual: process.env.STRIPE_PRICE_BASIC_ANNUAL,
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
  professional_annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  enterprise_annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL
};

module.exports = { stripe, STRIPE_PRICES };
```

#### **1.4 Enhanced Subscription Model**
```javascript
// Update server/src/models/Subscription.js
const subscriptionSchema = new mongoose.Schema({
  // Existing fields...
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  plan: { type: String, enum: ['basic', 'professional', 'enterprise'], required: true },
  
  // Add new Stripe fields
  stripeCustomerId: { type: String, required: true },
  stripeSubscriptionId: { type: String, required: true },
  stripePriceId: { type: String, required: true },
  stripeStatus: { 
    type: String,
    enum: ['active', 'past_due', 'canceled', 'unpaid', 'trialing'],
    default: 'trialing'
  },
  
  // Billing details
  billingCycle: { type: String, enum: ['monthly', 'annual'], required: true },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  trialEnd: { type: Date },
  
  // Payment tracking
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  lastPaymentDate: { type: Date },
  nextPaymentDate: { type: Date },
  
  // Enhanced payment history
  paymentHistory: [{
    amount: Number,
    currency: { type: String, default: 'USD' },
    date: Date,
    gateway: { type: String, default: 'stripe' },
    transactionId: String,
    invoiceId: String,
    status: { type: String, enum: ['succeeded', 'failed', 'pending'] }
  }]
});
```

#### **1.5 Payment Controller**
```javascript
// server/src/controllers/paymentController.js
const { stripe, STRIPE_PRICES } = require('../config/stripe');
const Subscription = require('../models/Subscription');
const BusinessProfile = require('../models/BusinessProfile');

// Create Stripe customer and subscription
const createSubscription = async (req, res) => {
  try {
    const { businessId, plan, billingCycle, paymentMethodId } = req.body;
    
    // Get business details
    const business = await BusinessProfile.findById(businessId);
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: business.businessEmail,
      name: business.name,
      metadata: { businessId: businessId.toString() }
    });
    
    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    
    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    
    // Get price ID
    const priceId = STRIPE_PRICES[`${plan}_${billingCycle}`];
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 14,
      metadata: { businessId: businessId.toString() }
    });
    
    // Save to database
    const newSubscription = new Subscription({
      business: businessId,
      plan,
      billingCycle,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeStatus: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    });
    
    await newSubscription.save();
    
    res.json({
      success: true,
      subscription: newSubscription,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update payment method
const updatePaymentMethod = async (req, res) => {
  try {
    const { subscriptionId, paymentMethodId } = req.body;
    
    const subscription = await Subscription.findById(subscriptionId);
    
    // Attach new payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.stripeCustomerId,
    });
    
    // Update customer's default payment method
    await stripe.customers.update(subscription.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    
    res.json({ success: true, message: 'Payment method updated successfully' });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await Subscription.findById(subscriptionId);
    
    // Cancel in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    // Update local database
    subscription.stripeStatus = 'canceled';
    await subscription.save();
    
    res.json({ success: true, message: 'Subscription canceled successfully' });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createSubscription,
  updatePaymentMethod,
  cancelSubscription
};
```

#### **1.6 Webhook Handler**
```javascript
// server/src/controllers/webhookController.js
const { stripe } = require('../config/stripe');
const Subscription = require('../models/Subscription');

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

const handlePaymentSucceeded = async (invoice) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription
  });

  if (subscription) {
    subscription.paymentStatus = 'completed';
    subscription.stripeStatus = 'active';
    subscription.lastPaymentDate = new Date();
    
    // Add to payment history
    subscription.paymentHistory.push({
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      date: new Date(),
      transactionId: invoice.payment_intent,
      invoiceId: invoice.id,
      status: 'succeeded'
    });
    
    await subscription.save();
  }
};

const handlePaymentFailed = async (invoice) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription
  });

  if (subscription) {
    subscription.paymentStatus = 'failed';
    subscription.stripeStatus = 'past_due';
    
    // Add to payment history
    subscription.paymentHistory.push({
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      date: new Date(),
      transactionId: invoice.payment_intent,
      invoiceId: invoice.id,
      status: 'failed'
    });
    
    await subscription.save();
    
    // Send notification email
    // TODO: Implement email notification
  }
};

module.exports = { handleStripeWebhook };
```

### **Phase 2: Frontend Payment Integration**

#### **2.1 Install Frontend Dependencies**
```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### **2.2 Stripe Configuration**
```typescript
// client/src/services/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default stripePromise;
```

#### **2.3 Payment Form Component**
```tsx
// client/src/components/PaymentForm.tsx
import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import stripePromise from '@/services/stripe';

const PaymentForm: React.FC<PaymentFormProps> = ({ plan, billingCycle, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    // Create payment method
    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement!,
    });

    if (pmError) {
      setError(pmError.message || 'Payment method creation failed');
      setIsLoading(false);
      return;
    }

    // Create subscription
    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          businessId: user.businessId,
          plan,
          billingCycle,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.subscription);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Subscription creation failed');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : `Subscribe to ${plan} Plan`}
      </Button>
    </form>
  );
};

// Wrapper component with Stripe Elements
const PaymentFormWrapper: React.FC = (props) => (
  <Elements stripe={stripePromise}>
    <PaymentForm {...props} />
  </Elements>
);

export default PaymentFormWrapper;
```

#### **2.4 Update Pricing Page**
```tsx
// Update client/src/pages/Pricing.tsx
import PaymentFormWrapper from '../components/PaymentForm';

// Add to existing Pricing component
const [showPaymentForm, setShowPaymentForm] = useState(false);
const [selectedPlan, setSelectedPlan] = useState<{plan: string, cycle: string} | null>(null);

const handleSelectPlan = (planName: string, cycle: string) => {
  setSelectedPlan({ plan: planName.toLowerCase(), cycle });
  setShowPaymentForm(true);
};

// Replace existing "Get Started" buttons with:
<Button
  onClick={() => handleSelectPlan(plan.name, isAnnual ? 'annual' : 'monthly')}
  className="w-full"
>
  Get Started
</Button>

// Add payment modal
{showPaymentForm && selectedPlan && (
  <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Subscribe to {selectedPlan.plan} Plan</DialogTitle>
      </DialogHeader>
      <PaymentFormWrapper
        plan={selectedPlan.plan}
        billingCycle={selectedPlan.cycle}
        onSuccess={(subscription) => {
          setShowPaymentForm(false);
          // Redirect to dashboard
          navigate('/business-dashboard');
        }}
      />
    </DialogContent>
  </Dialog>
)}
```

### **Phase 3: API Routes**

#### **3.1 Payment Routes**
```javascript
// server/src/routes/payment.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const {
  createSubscription,
  updatePaymentMethod,
  cancelSubscription
} = require('../controllers/paymentController');

// Create subscription
router.post('/create-subscription', verifyToken, requireRole('business'), createSubscription);

// Update payment method
router.put('/update-payment-method', verifyToken, requireRole('business'), updatePaymentMethod);

// Cancel subscription
router.delete('/subscription/:subscriptionId', verifyToken, requireRole('business'), cancelSubscription);

module.exports = router;
```

#### **3.2 Webhook Route**
```javascript
// server/src/routes/webhook.js
const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhookController');

// Stripe webhook - raw body needed
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
```

#### **3.3 Update Main App**
```javascript
// server/src/app.js
// Add routes
app.use('/api/payments', require('./routes/payment'));
app.use('/api/webhooks', require('./routes/webhook'));
```

---

## 🧪 **Testing Strategy**

### **Test Cards (Stripe Test Mode)**
```javascript
// Successful payment
4242424242424242

// Payment requires authentication
4000002500003155

// Payment is declined
4000000000000002

// Insufficient funds
4000000000009995
```

### **Test Scenarios**
1. ✅ Successful subscription creation
2. ✅ Payment method updates
3. ✅ Failed payment handling
4. ✅ Subscription cancellation
5. ✅ Webhook event processing
6. ✅ Trial period management

---

## 📊 **Success Metrics**

- Payment success rate > 95%
- Webhook processing < 5 seconds
- Subscription creation < 10 seconds
- Zero payment data storage (PCI compliance)

---

## 🚀 **Deployment Checklist**

### **Production Setup**
- [ ] Create Stripe live account
- [ ] Configure production webhooks
- [ ] Update environment variables
- [ ] Test payment flows in production
- [ ] Set up monitoring and alerts

This technical specification provides a complete implementation guide for integrating Stripe payments into your existing ServisbetA platform infrastructure.