# ServisbetA User Flows Documentation

## Platform Overview
ServisbetA is a B2B business review platform where:
- **Customers** can discover businesses and write reviews (free)
- **Businesses** must subscribe to list their business and manage reviews (paid)

## User Flow Types

### 1. Customer User Flow (Free Users)

#### Registration & Onboarding
1. **Sign Up**: User visits `/auth` and selects "Customer Account"
2. **Account Creation**: Provides name, email, password
3. **Email Verification**: Confirms email address
4. **Profile Setup**: Optional profile completion
5. **Dashboard Access**: Redirected to customer dashboard

#### Core Features (Free)
- **Browse Businesses**: Search and filter businesses on homepage
- **View Business Details**: Access business profiles and reviews
- **Write Reviews**: Create reviews with ratings, photos, and text
- **Manage Reviews**: Edit/delete own reviews
- **Profile Management**: Update personal information

#### User Journey
```
Homepage → Search/Browse → Business Detail → Write Review → Profile Management
```

### 2. Business User Flow (Paid Subscription)

#### Registration & Trial
1. **Sign Up**: Business visits `/auth` and selects "Business Account"
2. **Account Creation**: Provides business owner details
3. **14-Day Free Trial**: Access to all features without payment
4. **Business Profile Setup**: Add business information, photos, hours

#### Subscription Decision Point
After 14-day trial, business must choose:
- **Subscribe**: Select Basic ($49/mo), Professional ($99/mo), or Enterprise ($199/mo)
- **Trial Expires**: Account becomes view-only until subscription

#### Core Features (Paid)
- **Business Dashboard**: Analytics, review management, insights
- **Review Management**: Respond to reviews, flag inappropriate content
- **Profile Management**: Update business information, photos, hours
- **Analytics**: Track review trends, customer insights
- **Marketing Tools**: Review invitation campaigns, social integration

#### Business Journey
```
Registration → Free Trial → Business Setup → Subscription → Dashboard → Review Management
```

## Subscription Model Details

### Trial Period
- **Duration**: 14 days
- **Access**: Full feature access
- **No Credit Card**: Required only after trial
- **Grace Period**: 3 days after trial expiration

### Subscription Plans

#### Basic Plan - $49/month
- Business profile listing
- Up to 50 review responses per month
- Basic analytics dashboard
- Standard customer support
- Mobile-friendly business page
- Google My Business sync

#### Professional Plan - $99/month (Most Popular)
- Everything in Basic
- Unlimited review responses
- Advanced analytics & insights
- Priority listing placement
- Custom business page design
- Review invitation campaigns
- Competitor analysis
- Priority customer support
- Social media integration

#### Enterprise Plan - $199/month
- Everything in Professional
- Multi-location management
- White-label review platform
- API access for integrations
- Dedicated account manager
- Custom reporting & exports
- Advanced review filtering
- Bulk operations
- SSO integration
- 24/7 premium support

## Technical Implementation

### Authentication System
- **JWT Tokens**: 30-day expiration
- **Role-based Access**: user, business, admin
- **Social Login**: Google, Facebook integration
- **Password Reset**: Email-based recovery

### Database Schema
```javascript
// User roles
user: {
  role: 'user',           // Free customer account
  subscription: null
}

business: {
  role: 'business',       // Paid business account
  subscription: ObjectId, // Reference to subscription
  trialEndsAt: Date,     // Trial expiration date
  isActive: Boolean      // Subscription status
}

admin: {
  role: 'admin',         // Platform administration
  permissions: Array
}
```

### API Endpoints Structure

#### Public Endpoints (No Auth)
- `GET /api/businesses` - Browse businesses
- `GET /api/businesses/:id` - Business details
- `GET /api/reviews` - Public reviews
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

#### Customer Endpoints (User Auth)
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/users/profile` - User profile
- `PUT /api/users/profile` - Update profile

#### Business Endpoints (Business Auth + Active Subscription)
- `GET /api/businesses/dashboard` - Business dashboard
- `POST /api/businesses/profile` - Update business profile
- `POST /api/reviews/:id/response` - Respond to review
- `GET /api/businesses/analytics` - Review analytics
- `POST /api/subscriptions/manage` - Subscription management

#### Admin Endpoints (Admin Auth)
- `GET /api/admin/users` - User management
- `GET /api/admin/businesses` - Business management
- `POST /api/admin/subscriptions` - Subscription admin

## Page Structure & Navigation

### Public Pages
- `/` - Homepage with business search
- `/auth` - Login/Register with role selection
- `/pricing` - Business subscription plans
- `/businesses/:id` - Business detail pages

### Customer Dashboard (`/profile`)
- Profile management
- Review history
- Favorite businesses
- Account settings

### Business Dashboard (`/business-dashboard`)
- Analytics overview
- Review management
- Business profile editor
- Subscription status
- Response templates

### Admin Dashboard (`/admin`)
- User management
- Business verification
- Subscription monitoring
- Platform analytics

## Billing & Subscription Flow

### New Business Registration
1. Create account with 14-day trial
2. Access full dashboard features
3. Setup business profile
4. Receive trial expiration emails (7 days, 3 days, 1 day)
5. Trial expires → Limited access until subscription

### Subscription Management
- **Upgrade/Downgrade**: Immediate access to new features
- **Payment Failure**: 3-day grace period then suspension
- **Cancellation**: Access until end of billing period
- **Reactivation**: Full access restored immediately

## Support & Onboarding

### Customer Onboarding
- Welcome email with platform guide
- Optional profile completion prompts
- First review writing tutorial

### Business Onboarding
- Trial welcome email with setup checklist
- Business profile optimization tips
- Review management best practices
- Subscription reminder sequence

## Key Metrics & Analytics

### Customer Metrics
- Review submission rate
- Business discovery patterns
- User engagement scores

### Business Metrics
- Subscription conversion rate
- Trial to paid conversion
- Monthly recurring revenue (MRR)
- Feature adoption rates
- Review response rates

## Security & Compliance

### Data Protection
- GDPR compliance for EU users
- User data encryption
- Secure file upload validation
- Review moderation system

### Business Verification
- Email verification required
- Business information validation
- Manual review for suspicious accounts
- Ongoing monitoring for policy violations

## API Integration Examples

### Customer Review Creation
```javascript
// POST /api/reviews
{
  "businessId": "business_id",
  "rating": 5,
  "title": "Great service!",
  "content": "Excellent customer service and quality.",
  "photos": ["photo1.jpg", "photo2.jpg"]
}
```

### Business Review Response
```javascript
// POST /api/reviews/:reviewId/response
{
  "response": "Thank you for the positive feedback! We appreciate your business."
}
```

### Subscription Status Check
```javascript
// GET /api/businesses/subscription-status
{
  "isActive": true,
  "plan": "professional",
  "expiresAt": "2024-02-15T00:00:00Z",
  "features": ["unlimited_responses", "analytics", "priority_support"]
}
```

This documentation provides a complete overview of how ServisbetA operates as a business review platform with a clear distinction between free customer accounts and paid business subscriptions.
