const axios = require('axios');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️  PAYSTACK_SECRET_KEY not set in environment variables');
}

if (!PAYSTACK_PUBLIC_KEY) {
  console.warn('⚠️  PAYSTACK_PUBLIC_KEY not set in environment variables');
}

// Paystack API base URL
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Subscription Plans Configuration
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic',
    amount: 4900, // $49.00 in cents (Paystack uses smallest currency unit)
    currency: 'USD',
    interval: 'monthly',
    businessLimit: 1,
    features: [
      'Business profile listing',
      'Up to 50 review responses per month',
      'Basic analytics dashboard',
      'Standard customer support',
      'Mobile-friendly business page'
    ]
  },
  professional: {
    name: 'Professional',
    amount: 9900, // $99.00 in cents
    currency: 'USD',
    interval: 'monthly',
    businessLimit: 3,
    features: [
      'Everything in Basic',
      'Unlimited review responses',
      'Advanced analytics & insights',
      'Priority listing placement',
      'Custom business page design',
      'Review invitation campaigns',
      'Priority customer support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    amount: 19900, // $199.00 in cents
    currency: 'USD',
    interval: 'monthly',
    businessLimit: Infinity,
    features: [
      'Everything in Professional',
      'Unlimited business locations',
      'White-label review platform',
      'API access for integrations',
      'Dedicated account manager',
      'Custom reporting & exports',
      '24/7 premium support'
    ]
  }
};

// Paystack API helper
const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Helper function to initialize transaction
const initializeTransaction = async (email, amount, metadata = {}) => {
  try {
    const response = await paystackAPI.post('/transaction/initialize', {
      email,
      amount, // Amount in smallest currency unit (kobo for NGN, cents for USD)
      currency: metadata.currency || 'USD',
      metadata,
      callback_url: metadata.callback_url || `${process.env.CLIENT_URL}/subscription/verify`
    });
    return response.data;
  } catch (error) {
    console.error('Paystack initialize error:', error.response?.data || error.message);
    throw error;
  }
};

// Helper function to verify transaction
const verifyTransaction = async (reference) => {
  try {
    const response = await paystackAPI.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    console.error('Paystack verify error:', error.response?.data || error.message);
    throw error;
  }
};

// Helper function to create customer
const createCustomer = async (email, firstName, lastName, phone = null) => {
  try {
    const response = await paystackAPI.post('/customer', {
      email,
      first_name: firstName,
      last_name: lastName,
      phone
    });
    return response.data;
  } catch (error) {
    // Customer might already exist
    if (error.response?.data?.message?.includes('already exists')) {
      // Fetch existing customer
      const customerResponse = await paystackAPI.get(`/customer/${email}`);
      return customerResponse.data;
    }
    console.error('Paystack create customer error:', error.response?.data || error.message);
    throw error;
  }
};

// Helper function to charge authorization (for recurring payments)
const chargeAuthorization = async (authorizationCode, email, amount) => {
  try {
    const response = await paystackAPI.post('/transaction/charge_authorization', {
      authorization_code: authorizationCode,
      email,
      amount
    });
    return response.data;
  } catch (error) {
    console.error('Paystack charge authorization error:', error.response?.data || error.message);
    throw error;
  }
};

// Get plan details by plan name
const getPlanDetails = (planName) => {
  const plan = SUBSCRIPTION_PLANS[planName.toLowerCase()];
  if (!plan) {
    throw new Error(`Invalid plan: ${planName}`);
  }
  return plan;
};

// Convert amount from cents to dollars for display
const formatAmount = (amountInCents, currency = 'USD') => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

module.exports = {
  PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY,
  SUBSCRIPTION_PLANS,
  paystackAPI,
  initializeTransaction,
  verifyTransaction,
  createCustomer,
  chargeAuthorization,
  getPlanDetails,
  formatAmount
};
