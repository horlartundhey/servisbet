# Phase 2 Functionality Testing Guide - Quick Fix & Test

## Issue Resolution

The error you're seeing is because the BusinessProfile model expects specific field formats. Let me help you fix this and test the Phase 2 features.

## Quick Fix Steps

### Step 1: Fix the Business Creation Form

The form is missing required address fields. Here's how to test properly:

1. **Fill out the business form completely**:
   - Business Name: "Horlartundhey Restaurant" 
   - Category: Select "Restaurant" (with capital R - it's case sensitive)
   - Phone: "09126570599"
   - Email: "horlartundhey@gmail.com"
   - **Add these missing required fields**:
     - Street Address: "123 Main Street"
     - City: "Ibadan"
     - State: "Oyo" 
     - ZIP Code: "23402"
     - Country: "Nigeria" (or leave as default "United States")
   - Description: "Horlartundhey is setting up a prime time restaurant in the heart of ibadan, lagos and ekoa ibom"

### Step 2: Valid Category Options

The system expects these exact category values (case-sensitive):
- `Restaurant` ✅
- `Hotel`
- `Retail` 
- `Healthcare`
- `Beauty`
- `Automotive`
- `Technology`
- `Education`
- `Financial`
- `Legal`
- `Real Estate`
- `Entertainment`
- `Fitness`
- `Home Services`
- `Professional Services`
- `Other`

## Phase 2 Testing Workflow

### Test 1: Multi-Business Support ✅

**What to test**: Creating multiple businesses per user account

**Steps**:
1. **Login as business owner**:
   - Use existing account or create new business account
   - Email: business@servisbeta.com / Password: business123456 (if using seed data)

2. **Create First Business**:
   ```
   Business Name: "Coffee Paradise"
   Category: "Restaurant"
   Phone: "+1234567890"
   Email: "coffee@test.com"
   Street: "123 Coffee Street"
   City: "New York" 
   State: "NY"
   ZIP: "10001"
   Description: "Best coffee in town"
   ```

3. **Create Second Business**:
   - Click "Add Business" button in dashboard
   ```
   Business Name: "Pizza Corner"
   Category: "Restaurant" 
   Phone: "+0987654321"
   Email: "pizza@test.com"
   Street: "456 Pizza Avenue"
   City: "New York"
   State: "NY" 
   ZIP: "10002"
   Description: "Authentic Italian pizza"
   ```

4. **Verify Multi-Business**:
   - ✅ Business selector dropdown appears
   - ✅ Can switch between businesses
   - ✅ Dashboard updates for each business
   - ✅ Each business has unique slug auto-generated

### Test 2: Response Templates 🔧

**What to test**: Creating and managing response templates

**Steps**:
1. **Go to Templates Tab** in Business Dashboard
2. **Create Positive Template**:
   ```
   Name: "Thank You Response"
   Category: "positive"
   Content: "Thank you {{customerName}} for your {{rating}}-star review! We're delighted you enjoyed your experience at {{businessName}}."
   ```
3. **Create Negative Template**:
   ```
   Name: "Apology Response" 
   Category: "negative"
   Content: "Dear {{customerName}}, we sincerely apologize for your {{rating}}-star experience. We'd love to make this right. Please contact us directly at {{businessName}}."
   ```
4. **Test Template Variables**:
   - ✅ Variables {{customerName}}, {{rating}}, {{businessName}} detected
   - ✅ Template preview shows processed content
   - ✅ Templates save and load correctly

### Test 3: Bulk Response System 📧

**What to test**: Bulk responding to registered user reviews only

**Prerequisites**: Need some reviews from registered users (not anonymous)

**Steps**:
1. **Create Test Reviews** (as regular user):
   - Login as customer@servisbeta.com / customer123456
   - Write 3-4 reviews for your business (make sure anonymous is OFF)

2. **Test Bulk Response**:
   - Login as business owner
   - Go to Business Dashboard > Bulk Response tab
   - ✅ Only registered user reviews shown (anonymous excluded)
   - ✅ Select multiple unresponded reviews
   - ✅ Choose response template
   - ✅ Preview responses (personalized for each customer)
   - ✅ Send bulk responses

3. **Verify Results**:
   - ✅ Reviews marked as responded
   - ✅ Response history updated
   - ✅ Template usage statistics incremented

### Test 4: Review Dispute System ⚖️

**What to test**: Business owners disputing unfair reviews

**Steps**:
1. **Create a Negative Review** (as customer):
   - Rating: 1 star
   - Content: "Terrible service and bad food"
   - Make sure it's from registered user (not anonymous)

2. **Dispute the Review** (as business owner):
   - Go to Reviews tab in Business Dashboard
   - Find the negative review
   - Click "Dispute Review" button
   - Fill dispute form:
     ```
     Dispute Type: "fake_review" or "inappropriate_content"
     Reason: "Customer never visited our establishment"  
     Evidence: "We have security camera footage showing no such customer"
     Priority: "high"
     ```

3. **Verify Dispute Creation**:
   - ✅ Dispute created successfully
   - ✅ Review marked as "disputed"
   - ✅ Dispute appears in disputes list
   - ✅ Can add additional communication/evidence

### Test 5: Admin Dispute Resolution 👨‍⚖️

**What to test**: Admin handling review disputes

**Steps**:
1. **Login as Admin**:
   - Use admin@servisbeta.com / admin123456 (if using seed data)
   - Or create admin account

2. **Access Admin Dashboard**:
   - Navigate to Admin Dashboard
   - Click "Disputes" tab
   - ✅ All business disputes visible
   - ✅ Can view dispute details

3. **Resolve Dispute**:
   - Click on pending dispute
   - Review evidence and communication
   - Make decision:
     ```
     Decision: "Approved" or "Rejected"
     Resolution Notes: "Review removed due to insufficient evidence of visit"
     ```
   - Submit decision

4. **Verify Resolution**:
   - ✅ Dispute status updated to "resolved"
   - ✅ Business owner notified of decision
   - ✅ If approved, review flagged/hidden

### Test 6: Response Scheduling ⏰

**What to test**: Scheduling responses for future delivery

**Steps**:
1. **Prepare Bulk Response**:
   - Select reviews and template as in Test 3
   - Instead of "Send Now", click "Schedule"

2. **Set Schedule**:
   ```
   Date: Tomorrow's date
   Time: 10:00 AM (or 2 minutes from now for quick test)
   ```

3. **Verify Scheduling**:
   - ✅ Response scheduled successfully
   - ✅ Appears in "Scheduled Responses" list
   - ✅ Can view/cancel scheduled responses
   - ✅ Executes at scheduled time (check server logs)

### Test 7: Analytics Dashboard 📊

**What to test**: Business response analytics and insights

**Steps**:
1. **Generate Some Data** (complete previous tests first)
2. **Go to Analytics Tab** in Business Dashboard
3. **Check Metrics**:
   - ✅ Total responses count
   - ✅ Response rate percentage 
   - ✅ Template usage statistics
   - ✅ Charts render properly (using Recharts)
   - ✅ Scheduling analytics
   - ✅ Date filtering works

## API Testing (Optional)

If you want to test APIs directly:

```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"business@servisbeta.com","password":"business123456"}'

# Get user's businesses (replace TOKEN)
curl -X GET http://localhost:5000/api/business/my/businesses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get eligible reviews for bulk response
curl -X GET "http://localhost:5000/api/bulk-response/BUSINESS_ID/eligible-reviews" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get templates
curl -X GET "http://localhost:5000/api/templates?businessId=BUSINESS_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Common Issues:

1. **Validation Errors**: 
   - Ensure all required fields filled
   - Use exact category names (case-sensitive)
   - Include complete address information

2. **No Reviews Showing in Bulk Response**:
   - Ensure reviews are from registered users (not anonymous)
   - Check review exists and is unresponded
   - Verify business ownership

3. **Templates Not Working**:
   - Check variable syntax: {{variableName}}
   - Ensure template belongs to business or is public

4. **Admin Features Not Available**:
   - Ensure user has admin role
   - Check admin routes are properly protected

5. **Scheduling Not Working**:
   - Check server logs for cron execution
   - Ensure scheduled time is in future
   - Verify node-cron is working

## Success Criteria

After testing, you should have:

- ✅ 2+ businesses under one user account
- ✅ Multiple response templates created and working  
- ✅ Bulk responses sent to registered user reviews only
- ✅ At least one review dispute created and resolved
- ✅ Response scheduling working
- ✅ Analytics dashboard showing data

## Next Steps

Once basic functionality is confirmed:

1. **Performance Testing**: Test with larger datasets
2. **User Experience**: Test complete user workflows
3. **Edge Cases**: Test error handling and validation
4. **Security**: Test authorization and data access
5. **Mobile**: Test responsive design

The key is to fix the validation errors first by providing complete business information, then systematically test each Phase 2 feature.