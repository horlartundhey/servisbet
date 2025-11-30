# 🎯 Subscription Phase Implementation Breakdown (Paystack Integration)

## 📊 Current State Analysis

### ✅ What's Already Built:
1. **Database Models**
   - `Subscription.js` - Basic subscription schema (business, plan, dates, payment history)
   - Plans: 'paid', 'premium', 'custom' (will update to 'basic', 'professional', 'enterprise')
   
2. **Backend API**
   - `GET /api/subscription` - List all subscriptions (admin)
   - `POST /api/subscription` - Create subscription (business)
   - `GET /api/subscription/business/:businessId` - Get business subscriptions
   
3. **Frontend UI**
   - `Pricing.tsx` - Beautiful pricing page with 3 tiers (Basic $49, Professional $99, Enterprise $199)
   - Features monthly billing display
   - "Start Free Trial" buttons (will update to "Get Started")
   
4. **Documentation**
   - Complete implementation specifications
   - Phase 3 & 4 implementation plans

### ❌ What's Missing:
1. **Payment Gateway Integration** (Paystack - for African market)
2. **Webhook Handling** (payment success/failure events)
3. **NO Trial Period** (Payment required immediately before any business listing)
4. **Automated Billing & Renewal**
5. **Payment Failure Handling** (3-7 day grace period)
6. **Subscription Management UI** (cancel, upgrade, downgrade)
7. **Business Limit Enforcement** (1/3/unlimited based on plan)
8. **Invoice Generation & History**
9. **Payment Method Management**
10. **Admin Subscription Dashboard**
11. **Email Notifications** (payment confirmations, renewal reminders, etc.)

---

## 💼 **SUBSCRIPTION BUSINESS MODEL**

### **Core Rules:**
1. ✅ **NO TRIAL PERIOD** - Payment required immediately
2. ✅ **Subscription Required to List** - Must pay before creating any business
3. ✅ **Business Limit Enforcement:**
   - Basic: 1 business location
   - Professional: 3 business locations
   - Enterprise: Unlimited locations
4. ✅ **Payment Failure Grace Period:** 3-7 days before suspension
5. ✅ **Expired Business Handling:** Hide from public, keep data (can reactivate)
6. ✅ **Monthly Billing Only** (no annual discount for now)

### **User Access Matrix:**

| User Type | Can Browse | Can Review | Can List Business | Need Subscription |
|-----------|-----------|------------|-------------------|-------------------|
| Regular User | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Business User (No Sub) | ✅ Yes | ✅ Yes | ❌ No | ⚠️ Required |
| Business User (Active Sub) | ✅ Yes | ✅ Yes | ✅ Yes (up to limit) | ✅ Active |
| Business User (Expired Sub) | ✅ Yes | ✅ Yes | ❌ No | ⚠️ Renew Required |

---

## 🏗️ Implementation Roadmap (Step-by-Step)

### **PHASE 1: Foundation (Week 1) - Payment Gateway Setup**

#### Step 1.1: Paystack Account Setup (Day 1)
**What to do:**
- [ ] Use provided Paystack test keys
- [ ] Create Products in Paystack Dashboard (optional):
  - Basic Plan ($49/month)
  - Professional Plan ($99/month)
  - Enterprise Plan ($199/month)
- [ ] Note: Can use inline payment without creating products
- [ ] Get webhook URL setup instructions

**Deliverable:** Paystack test credentials ready

---

#### Step 1.2: Backend Paystack Configuration (Day 1-2)
**What to do:**
```bash
# Install dependencies
cd server
npm install paystack-node axios
```

**Files to create:**
1. `server/src/config/paystack.js` - Paystack client configuration
2. Update `.env` with Paystack keys

**Environment Variables:**
```env
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=xxxxx
```

**Code changes:**
- Initialize Paystack SDK
- Store plan prices as constants
- Export Paystack client for use in routes

**Deliverable:** Paystack SDK configured and ready

---

#### Step 1.3: Update Subscription Model (Day 2)
**What to do:**
Update `server/src/models/Subscription.js` to include:
- `paystackCustomerCode` - Links to Paystack customer
- `paystackSubscriptionCode` - Links to Paystack subscription (if using)
- `plan` - 'basic', 'professional', 'enterprise'
- `status` - 'active', 'past_due', 'suspended', 'cancelled'
- `businessLimit` - Number of businesses allowed (1, 3, or Infinity)
- `currentBusinessCount` - How many businesses currently listed
- `billingCycle` - 'monthly' only (no annual for now)
- `amount` - Monthly subscription amount in smallest currency unit (4900 = $49.00)
- `currency` - 'USD' or 'NGN' based on Paystack setup
- `currentPeriodStart/End` - Billing cycle dates
- `nextBillingDate` - When next payment is due
- `gracePeriodEnd` - Date when grace period ends (if payment failed)
- Enhanced `paymentHistory` with transaction data

**Deliverable:** Enhanced Subscription model with Paystack fields and business limits

---

#### Step 1.4: Create Payment Controller (Day 2-3)
**What to do:**
Create `server/src/controllers/paymentController.js` with:
- `initializePayment()` - Initialize Paystack payment for subscription
- `verifyPayment()` - Verify payment after redirect
- `handleWebhook()` - Process Paystack webhook events (charge.success, subscription.disable)
- `getTransactionHistory()` - Fetch customer payment history
- `cancelSubscription()` - Cancel active subscription (set status to cancelled)
- `upgradeSubscription()` - Upgrade to higher plan (immediate effect)
- `downgradeSubscription()` - Downgrade to lower plan (at next billing cycle)
- `checkBusinessLimit()` - Verify business count against plan limit

**Deliverable:** Complete payment controller with Paystack integration

---

#### Step 1.5: Create Payment Routes (Day 3)
**What to do:**
Create `server/src/routes/payment.js` with:
```
POST   /api/payment/initialize           # Initialize payment (returns payment URL)
GET    /api/payment/verify/:reference    # Verify payment after redirect
POST   /api/payment/webhook              # Paystack webhook endpoint (raw body)
GET    /api/payment/transactions         # Get user's transaction history
POST   /api/payment/cancel               # Cancel subscription
POST   /api/payment/upgrade              # Upgrade plan
POST   /api/payment/downgrade            # Downgrade plan (next cycle)
GET    /api/payment/status               # Check current subscription status
```

**Deliverable:** Payment API routes for Paystack

---

### **PHASE 2: Frontend Integration (Week 1-2)**

#### Step 2.1: Install Paystack React SDK (Day 4)
```bash
cd client
npm install react-paystack
```

---

#### Step 2.2: Create Payment Service (Day 4)
**What to do:**
Create `client/src/services/paymentService.ts`:
- API calls to payment endpoints
- Initialize payment function
- Verify payment function
- Get subscription status
- Cancel/upgrade/downgrade functions

**Deliverable:** Payment service for API integration

---

#### Step 2.3: Update Pricing Page (Day 4-5)
**What to do:**
Update `client/src/pages/Pricing.tsx`:
- Change "Start Free Trial" to "Get Started"
- Add "Payment Required - No Trial" messaging
- Connect buttons to Paystack payment modal
- Add loading states during payment initialization
- Handle payment success/failure
- Show plan limits (1/3/unlimited businesses)

**Deliverable:** Functional subscription purchase flow with Paystack

---

#### Step 2.4: Create Payment Modal Component (Day 5)
**What to do:**
Create `client/src/components/PaystackPaymentModal.tsx`:
- Uses react-paystack library
- Display selected plan details
- Open Paystack inline popup
- Handle payment success → verify on backend
- Handle payment close/cancel
- Show loading states

**Deliverable:** Reusable Paystack payment modal

---

#### Step 2.5: Create Success/Blocked Pages (Day 5)
**What to do:**
- `client/src/pages/SubscriptionSuccess.tsx` - Payment successful, redirect to dashboard
- `client/src/pages/SubscriptionRequired.tsx` - Blocked access page for non-subscribers
- `client/src/pages/SubscriptionExpired.tsx` - Renewal required page

**Deliverable:** Post-payment flow pages

---

### **PHASE 3: Subscription Management & Access Control (Week 2)**

#### Step 3.1: Business Dashboard Subscription Section (Day 6-7)
**What to do:**
Update `client/src/pages/BusinessDashboard.tsx` to show:
- Current plan details (Basic/Professional/Enterprise)
- Business usage: "2 / 3 businesses used"
- Next payment date
- **NO TRIAL STATUS** (immediate payment required)
- "Upgrade Plan" button (if not on Enterprise)
- "Cancel Subscription" button
- Payment history table

**Deliverable:** Subscription overview in dashboard

---

#### Step 3.2: Access Control Middleware (Day 7-8)
**What to do:**
Backend:
- Create `checkActiveSubscription` middleware
- Block business creation if no subscription
- Block business creation if limit reached
- Block dashboard access if subscription expired
- Add grace period logic (3-7 days for failed payments)

Frontend:
- Route guards for business dashboard
- Redirect to pricing if no subscription
- Show "Subscription Required" modal on restricted actions
- Show "Upgrade Required" modal when limit reached

**Deliverable:** Complete access control system

---

#### Step 3.3: Business Limit Enforcement (Day 8-9)
**What to do:**
Backend:
- Update Business creation endpoint to check limit
- Update Subscription when business created/deleted
- Handle business archiving on downgrades
- Prevent deletion if it would exceed downgraded limit

Frontend:
- Show "Create Business" button only if under limit
- Show limit warning when near cap
- Show upgrade prompt when limit reached
- Allow selection of which business to keep on downgrade

**Deliverable:** Complete business limit enforcement

---

#### Step 3.4: Webhook Processing (Day 9)
**What to do:**
Implement webhook handlers for:
- `charge.success` - Payment successful → activate/renew subscription
- `subscription.disable` - Auto-renewal disabled → mark for cancellation
- `subscription.not_renew` - Subscription ended → cancel subscription
- Handle failed payments → set grace period
- Handle subscription cancellations → hide businesses

**Deliverable:** Complete Paystack webhook system

---

### **PHASE 4: Admin Features (Week 3)**

#### Step 4.1: Admin Subscription Dashboard (Day 10-11)
**What to do:**
Update `client/src/pages/AdminDashboard.tsx` to show:
- Total active subscriptions
- Revenue metrics (MRR, ARR)
- Subscription status breakdown
- Failed payments list
- Trial conversions rate
- Churn rate

**Deliverable:** Admin subscription analytics

---

#### Step 4.2: Admin Subscription Management (Day 11-12)
**What to do:**
Admin can:
- View all customer subscriptions
- Manually cancel subscriptions
- Issue refunds
- Apply discounts/coupons
- Extend trials
- Send payment reminders

**Deliverable:** Admin subscription tools

---

### **PHASE 5: Notifications & Polish (Week 3-4)**

#### Step 5.1: Email Notifications (Day 13)
**What to do:**
Send emails for:
- **NO TRIAL EMAILS** (payment required immediately)
- Subscription activated (welcome email)
- Payment successful (monthly renewal)
- Payment failed (with grace period notice)
- Grace period ending (2 days before suspension)
- Subscription suspended (businesses hidden)
- Subscription cancelled (businesses archived)
- Approaching business limit (at 80% of limit)
- Business limit reached (can't create more)

**Deliverable:** Email notification system

---

#### Step 5.2: In-App Notifications (Day 14)
**What to do:**
Show notifications for:
- Payment due soon (3 days before)
- Payment failed (grace period active)
- Grace period ending
- Subscription suspended
- Business limit reached
- Subscription upgraded/downgraded
- Business archived (on downgrade)

**Deliverable:** In-app notification system

---

#### Step 5.3: Invoice & Receipt System (Day 15)
**What to do:**
- Generate PDF invoices
- Email invoices automatically
- Invoice history page
- Download/print receipts

**Deliverable:** Complete invoicing system

---

## 📋 Implementation Checklist

### Phase 1: Payment Gateway (Paystack) ✅
- [ ] Paystack test keys configured
- [ ] Paystack SDK installed (paystack-node)
- [ ] Subscription model updated with Paystack fields
- [ ] Business limit fields added (businessLimit, currentBusinessCount)
- [ ] Payment controller created
- [ ] Payment routes added
- [ ] Webhook endpoint created (raw body parser)
- [ ] Environment variables set

### Phase 2: Frontend Integration ✅
- [ ] react-paystack installed
- [ ] Payment service created
- [ ] Pricing page updated (remove "trial" language)
- [ ] Paystack payment modal created
- [ ] Success/blocked pages created
- [ ] Business limit display added
- [ ] Subscription required guards

### Phase 3: Access Control & Limits ✅
- [ ] Dashboard subscription section
- [ ] checkActiveSubscription middleware
- [ ] checkBusinessLimit middleware
- [ ] Business creation limit enforcement
- [ ] Subscription status checks
- [ ] Grace period logic (3-7 days)
- [ ] Business hiding on expiry
- [ ] Webhook handlers complete
- [ ] Payment history displayed

### Phase 4: Admin Features ✅
- [ ] Admin subscription dashboard
- [ ] Revenue metrics (MRR)
- [ ] Active subscriptions count
- [ ] Subscription status breakdown
- [ ] Failed payments list
- [ ] Business limits overview
- [ ] Manual subscription management

### Phase 5: Notifications & Polish ✅
- [ ] Email templates created (no trial emails)
- [ ] Email sending service
- [ ] In-app notifications
- [ ] Transaction history page
- [ ] Upgrade/downgrade flows
- [ ] Business limit warnings
- [ ] Grace period notifications

---

## 🎯 Quick Start Priorities

### **Week 1 Focus:** Core Payment Flow
1. Stripe setup
2. Backend payment controller
3. Frontend checkout
4. Basic webhook handling

**Goal:** Customers can subscribe and pay

---

### **Week 2 Focus:** Subscription Management
1. Trial logic
2. Dashboard subscription UI
3. Cancel/upgrade flows
4. Complete webhook handling

**Goal:** Full subscription lifecycle working

---

### **Week 3 Focus:** Admin & Notifications
1. Admin dashboard
2. Email notifications
3. Invoice system
4. Polish & testing

**Goal:** Production-ready subscription system

---

## 💰 Expected Outcomes

### Revenue Projections
- **Month 1:** 10-20 paying businesses
- **Month 2:** 30-50 paying businesses
- **Month 3:** 75-100 paying businesses

### Conversion Rates
- **Trial → Paid:** 25-30%
- **Basic → Professional:** 15-20%
- **Professional → Enterprise:** 5-10%

### Monthly Recurring Revenue (MRR)
- **Month 1:** $500-$1,000
- **Month 2:** $1,500-$2,500
- **Month 3:** $3,000-$5,000
- **Month 6:** $10,000-$15,000

---

## 🚨 Critical Success Factors

### Must-Have for Launch:
1. ✅ **Secure payment processing** (Stripe handles this)
2. ✅ **Clear pricing & trial terms**
3. ✅ **Reliable webhook handling** (auto-updates subscription)
4. ✅ **Trial period enforcement**
5. ✅ **Payment failure handling**

### Nice-to-Have (Post-Launch):
1. ⏳ Discount codes
2. ⏳ Referral program
3. ⏳ Annual billing discount
4. ⏳ Usage-based billing
5. ⏳ Multi-currency support

---

## 🎓 Learning Resources

### Stripe Documentation:
- Checkout Sessions: https://stripe.com/docs/payments/checkout
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Webhooks: https://stripe.com/docs/webhooks
- Customer Portal: https://stripe.com/docs/billing/subscriptions/integrating-customer-portal

### Code Examples:
- Stripe Node.js: https://github.com/stripe/stripe-node
- Stripe React: https://github.com/stripe/react-stripe-js

---

## 🤝 Next Steps

**Question for you:** Which phase would you like to start with?

**Option A:** Start from Phase 1 (Stripe setup) and build sequentially
**Option B:** Jump to specific feature (e.g., trial logic, webhooks)
**Option C:** Review and plan more before implementation

**My recommendation:** Start with Phase 1 (Payment Gateway Setup) - it's the foundation everything else builds on. Should take 2-3 days to get basic payment flow working.

---

## 🔄 **COMPLETE BUSINESS OWNER FLOW**

### **Scenario 1: New Business Owner Signs Up**

```
Step 1: Discovery
- Visitor lands on homepage
- Clicks "For Business" or "List Your Business"
- Redirected to /pricing page

Step 2: View Pricing
- Sees 3 plans:
  ✅ Basic ($49/month) - 1 business
  ✅ Professional ($99/month) - 3 businesses
  ✅ Enterprise ($199/month) - Unlimited businesses
- No mention of "free trial"
- Clear message: "Payment required to start listing"

Step 3: Registration
- Clicks "Get Started" on chosen plan
- Redirected to /auth?plan=basic (or professional/enterprise)
- Fills signup form:
  * Email
  * Password
  * Business Name (optional at signup)
  * Role: automatically set to "business"
- Creates account

Database State:
User {
  email: "owner@cafe.com",
  role: "business",
  hasActiveSubscription: false,  // ❌
  subscriptionId: null
}

Step 4: Immediate Payment Redirect
- After signup → Immediately redirected to payment page
- Cannot access dashboard without payment
- Shows:
  "Complete your subscription to start listing"
  "Plan: Basic - $49/month"
  [Pay with Paystack Button]

Step 5: Payment Process
- Clicks "Pay with Paystack"
- Paystack popup modal opens
- Enters card details OR selects bank transfer
- Completes payment
- Paystack processes transaction

Step 6: Payment Verification
- Frontend receives payment response
- Calls backend: POST /api/payment/verify/:reference
- Backend:
  * Verifies with Paystack API
  * Creates Subscription record
  * Updates User record
  * Returns success

Database State After Payment:
User {
  email: "owner@cafe.com",
  role: "business",
  hasActiveSubscription: true,  // ✅
  subscriptionId: ObjectId("sub_123")
}

Subscription {
  _id: ObjectId("sub_123"),
  business: ObjectId("user_123"),
  plan: "basic",
  status: "active",
  businessLimit: 1,
  currentBusinessCount: 0,  // No businesses yet
  amount: 4900,  // $49.00
  currency: "USD",
  paystackCustomerCode: "CUS_xxx",
  currentPeriodStart: "2025-10-14",
  currentPeriodEnd: "2025-11-14",
  nextBillingDate: "2025-11-14",
  paymentStatus: "completed",
  paymentHistory: [{
    amount: 4900,
    date: "2025-10-14",
    gateway: "paystack",
    transactionId: "PAY_xxx",
    status: "succeeded"
  }]
}

Step 7: Access Granted
- Redirected to /business-dashboard
- Sees welcome message:
  "🎉 Welcome! You're on the Basic plan"
  "You can create up to 1 business listing"
- Dashboard shows:
  * Subscription panel (Basic, Active, Next: Nov 14)
  * "Create New Business" button (enabled ✅)
  * Empty business list

Step 8: Create First Business
- Clicks "Create New Business"
- Fills business form:
  * Business Name: "Joe's Cafe"
  * Category: "Restaurant"
  * Location
  * Description
  * Upload images
- Submits

Backend Validation:
✅ User is authenticated
✅ User role = "business"
✅ Subscription exists and status = "active"
✅ currentBusinessCount (0) < businessLimit (1)
✅ Create business allowed!

Business Created:
Business {
  _id: ObjectId("biz_123"),
  name: "Joe's Cafe",
  owner: ObjectId("user_123"),
  category: "Restaurant",
  isPublic: true,  // ✅ Visible to everyone
  isActive: true,
  status: "active"
}

Subscription Updated:
Subscription {
  currentBusinessCount: 1,  // Incremented
  // (Now at limit for Basic plan)
}

Step 9: Viewing Limits
- Dashboard now shows:
  "Businesses: 1 / 1 used ⚠️"
  "You've reached your plan limit!"
  "Upgrade to Professional for 3 businesses"
- "Create New Business" button disabled ❌
- Shows [Upgrade Plan] button instead
```

---

### **Scenario 2: Trying to Create Business Without Subscription**

```
Step 1: User (no subscription) tries to access dashboard
- URL: /business-dashboard
- Route guard checks: hasActiveSubscription = false
- Redirected to /pricing
- Message: "Subscribe to start listing your business"

Step 2: User tries API directly
- POST /api/business
- checkActiveSubscription middleware runs
- Returns 402 Payment Required:
  {
    error: "Active subscription required",
    redirectTo: "/pricing"
  }
- Frontend shows modal:
  "Subscription Required"
  "You need an active subscription to list businesses"
  [View Plans Button]
```

---

### **Scenario 3: Exceeding Business Limit**

```
User has Basic plan (1 business) and tries to create 2nd:

Frontend:
- "Create New Business" button disabled
- Shows warning banner:
  "⚠️ Plan Limit Reached"
  "You have 1 business (limit: 1)"
  "Upgrade to Professional for 3 businesses"
- Clicking button shows upgrade modal

Backend (if bypassed):
- POST /api/business
- checkBusinessLimit middleware runs
- Returns 403 Forbidden:
  {
    error: "You've reached your plan limit (1 businesses)",
    currentPlan: "basic",
    currentCount: 1,
    limit: 1,
    upgradeRequired: true
  }
```

---

### **Scenario 4: Monthly Renewal (Success)**

```
Timeline: User subscribed on Oct 14, renewal on Nov 14

Nov 11 (3 days before):
- Email: "Your subscription renews in 3 days"
- Dashboard banner: "Payment due Nov 14 - $49"

Nov 14 (Renewal Date):
- Automatic charge attempt on Paystack
- Paystack charges saved card: $49

SUCCESS Path:
✅ Payment successful
✅ Webhook: charge.success
✅ Backend updates:
   - nextBillingDate: Dec 14
   - currentPeriodStart: Nov 14
   - currentPeriodEnd: Dec 14
   - Add to paymentHistory
✅ Email: "Payment Successful - Your subscription is renewed"
✅ Business listings remain active
```

---

### **Scenario 5: Monthly Renewal (Failed)**

```
Nov 14 (Renewal Date):
- Automatic charge attempt
- Payment FAILS (insufficient funds/expired card)

FAILURE Path:
❌ Payment failed
❌ Webhook: charge.failed (if Paystack sends this)
❌ Backend updates:
   - status: "past_due"
   - gracePeriodEnd: Nov 21 (7 days grace)
❌ Email: "⚠️ Payment Failed"
   Subject: "Payment Failed - Update Your Payment Method"
   Body: "We couldn't charge your card for $49"
         "You have until Nov 21 to update payment"
         [Update Payment Method Button]

Dashboard State:
- Red banner: "⚠️ Payment Failed"
  "Your subscription payment failed"
  "Update payment by Nov 21 or businesses will be hidden"
  [Update Payment Method]
- Business listings still active (grace period)
- Can still manage businesses
- Can't create new businesses

Nov 18 (3 days into grace):
- Email reminder: "2 days left to update payment"
- Dashboard: countdown timer

Nov 21 (Grace Period Expires):
- status: "suspended"
- Email: "🚫 Subscription Suspended"
- Dashboard: All features locked
- Businesses updated:
  * isPublic: false  // Hidden from search
  * isActive: false
  * status: "suspended"
- Public view: "Business currently unavailable"

Nov 28 (7 days after suspension):
- status: "cancelled"
- Businesses archived (soft delete)
- Must resubscribe to regain access
```

---

### **Scenario 6: Upgrade (Basic → Professional)**

```
User has:
- Basic plan: 1 business active
- Wants to add 2 more locations

Flow:
1. Dashboard → "Upgrade Plan" button
2. Redirected to /pricing?upgrade=true
3. Sees Professional plan highlighted
4. Clicks "Upgrade to Professional"
5. Paystack payment modal (prorated amount):
   - Current plan: $49, 15 days left
   - New plan: $99
   - Prorated charge: ($99 - $49) × (15/30) = $25
6. Payment successful
7. Backend updates:
   - plan: "professional"
   - businessLimit: 3
   - amount: 9900
   - nextBillingDate: unchanged (Nov 14)
8. Dashboard updates immediately:
   - "Businesses: 1 / 3 used ✅"
   - "Create New Business" enabled
9. Can now create 2 more businesses
```

---

### **Scenario 7: Downgrade (Professional → Basic)**

```
User has:
- Professional plan: 2 businesses active
- Wants to save money

Flow:
1. Dashboard → "Change Plan" → "Downgrade to Basic"
2. System checks: currentBusinessCount (2) > basicLimit (1) ❌
3. Shows modal:
   "⚠️ You have 2 active businesses"
   "Basic plan allows only 1 business"
   "Choose which business to keep active:"
   
   ○ Joe's Cafe (Main Street)
     - 45 reviews, 4.5★
   
   ○ Joe's Cafe Downtown
     - 12 reviews, 4.8★
   
   [Select Primary Business]
   
   "The other business will be archived"
   "(Hidden from public, can reactivate on upgrade)"

4. User selects "Joe's Cafe (Main Street)"
5. Confirms downgrade
6. Backend:
   - Schedules downgrade for next billing cycle
   - pendingPlanChange: "basic"
   - businessToArchive: ObjectId("biz_downtown")
7. Dashboard shows:
   "⚠️ Downgrade Scheduled"
   "Your plan will change to Basic on Nov 14"
   "Joe's Cafe Downtown will be archived"
   [Cancel Downgrade]

Nov 14 (Next Billing Cycle):
- Charge reduced amount: $49 (from $99)
- plan: "basic"
- businessLimit: 1
- Business #2 updated:
  * isPublic: false
  * isActive: false
  * status: "archived"
- No refund (downgrade at renewal)
```

---

## ✅ **Confirmed Implementation Details**

1. **Business Limits:**
   - Basic: 1 business location ✅
   - Professional: 3 business locations ✅
   - Enterprise: Unlimited ✅

2. **Expired Business Handling:**
   - Hide from public (isPublic: false) ✅
   - Keep data intact ✅
   - Can reactivate on renewal ✅

3. **Payment Failure Grace Period:**
   - 3-7 days before suspension ✅
   - Notifications during grace period ✅

4. **User Access Without Subscription:**
   - Regular users: Browse & review ✅
   - Business users: Browse & review ✅
   - Business users: Cannot list businesses without subscription ✅

5. **Billing:**
   - Monthly only (no annual discount for now) ✅
   - Immediate payment required (no trial) ✅

---

Ready to proceed with Phase 1 implementation! 🚀
