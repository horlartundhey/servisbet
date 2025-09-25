# Phase 2 Testing Guide - ServisbetA

This guide provides step-by-step instructions for testing all Phase 2 features that were implemented.

## Prerequisites

1. **Server Setup**
   ```bash
   cd server
   npm install
   npm start
   ```
   - Verify server runs on port 5000 (or configured port)
   - Check that "Response Scheduler Service initialized" appears in logs

2. **Client Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   - Verify client runs on port 3000 (or configured port)

3. **Database Setup**
   - Ensure MongoDB is running
   - Check database connection in server logs

4. **Test Accounts**
   - Create at least 2 user accounts (one business owner, one regular user)
   - Create at least 1 admin account
   - Have some existing reviews for testing

## Testing Checklist

### 1. Multi-Business Support Testing

#### Test 1.1: Business Profile Model Updates
**Objective**: Verify multiple businesses per user are supported

**Steps**:
1. Log in as a business owner
2. Navigate to Business Dashboard
3. Try creating a new business profile
4. Verify both businesses appear in account

**Expected Results**:
- ✅ No unique constraint errors on business creation
- ✅ Both businesses visible in user's account
- ✅ Each business has unique slug
- ✅ One business marked as "primary"

**API Test**:
```bash
# Create first business
POST /api/business-profile
{
  "businessName": "Coffee Shop 1",
  "category": "restaurant",
  "description": "First coffee shop"
}

# Create second business  
POST /api/business-profile
{
  "businessName": "Coffee Shop 2", 
  "category": "restaurant",
  "description": "Second coffee shop"
}
```

#### Test 1.2: Business Management API
**Objective**: Test multi-business management endpoints

**Steps**:
1. **Get User's Businesses**:
   ```bash
   GET /api/business/my/businesses
   ```
   Expected: Array of user's businesses

2. **Get Primary Business**:
   ```bash
   GET /api/business/my/primary
   ```
   Expected: The primary business object

3. **Create Additional Business**:
   ```bash
   POST /api/business/create-additional
   {
     "businessName": "New Restaurant",
     "category": "restaurant",
     "description": "Additional business"
   }
   ```
   Expected: New business created successfully

4. **Set Primary Business**:
   ```bash
   PUT /api/business/{businessId}/set-primary
   ```
   Expected: Business marked as primary

**Expected Results**:
- ✅ All endpoints return proper responses
- ✅ Authorization works correctly
- ✅ Primary business logic functions
- ✅ Business switching works

#### Test 1.3: Frontend Multi-Business Interface
**Objective**: Test business selector and creation UI

**Steps**:
1. Log in as business owner with multiple businesses
2. Check Business Dashboard for business selector dropdown
3. Switch between businesses using dropdown
4. Click "Add New Business" button
5. Fill out new business form and submit
6. Verify new business appears in selector

**Expected Results**:
- ✅ Business selector dropdown visible
- ✅ All user's businesses listed in dropdown
- ✅ Active business highlighted
- ✅ Business switching updates dashboard content
- ✅ New business creation form works
- ✅ Form validation prevents invalid submissions

### 2. Review Dispute System Testing

#### Test 2.1: Dispute Model and Creation
**Objective**: Test dispute submission functionality

**API Test**:
```bash
POST /api/disputes
{
  "reviewId": "REVIEW_ID_HERE",
  "businessId": "BUSINESS_ID_HERE",
  "disputeType": "fake_review",
  "reason": "This review appears to be fake",
  "evidence": "Customer never visited our establishment",
  "priority": "high"
}
```

**Frontend Test**:
1. Navigate to Business Dashboard > Reviews tab
2. Find a review to dispute
3. Click "Dispute Review" button
4. Fill out dispute form:
   - Select dispute type
   - Write detailed reason
   - Add evidence
   - Set priority level
5. Submit dispute

**Expected Results**:
- ✅ Dispute created successfully
- ✅ Dispute appears in business's dispute list
- ✅ Email notification sent (if configured)
- ✅ Review marked as "disputed"

#### Test 2.2: Dispute Management
**Objective**: Test dispute tracking and communication

**Steps**:
1. **View Business Disputes**:
   ```bash
   GET /api/disputes/my-disputes/{businessId}
   ```

2. **Add Communication**:
   ```bash
   POST /api/disputes/{disputeId}/communicate
   {
     "message": "Additional evidence attached",
     "type": "evidence_update"
   }
   ```

3. **Update Evidence**:
   ```bash
   PUT /api/disputes/{disputeId}/evidence
   {
     "evidence": "Updated evidence information"
   }
   ```

**Expected Results**:
- ✅ Disputes listed with current status
- ✅ Communication thread updates
- ✅ Evidence updates saved
- ✅ Timestamps recorded correctly

### 3. Admin Dispute Resolution Testing

#### Test 3.1: Admin Dispute Dashboard
**Objective**: Test admin interface for dispute management

**Steps**:
1. Log in as admin user
2. Navigate to Admin Dashboard
3. Click "Disputes" tab
4. Verify list of pending disputes appears
5. Click on a dispute to view details

**Expected Results**:
- ✅ All disputes visible to admin
- ✅ Dispute details load correctly
- ✅ Business and review information displayed
- ✅ Communication history visible

#### Test 3.2: Dispute Resolution
**Objective**: Test admin decision-making functionality

**API Tests**:
```bash
# Approve dispute
PUT /api/disputes/{disputeId}/resolve
{
  "decision": "approved",
  "resolution": "Review removed as fake",
  "adminNotes": "Clear evidence of fake review"
}

# Reject dispute  
PUT /api/disputes/{disputeId}/resolve
{
  "decision": "rejected", 
  "resolution": "Insufficient evidence",
  "adminNotes": "Review appears legitimate"
}
```

**Frontend Steps**:
1. Open dispute details in admin dashboard
2. Review evidence and communication
3. Click "Approve" or "Reject" button
4. Enter resolution notes
5. Submit decision

**Expected Results**:
- ✅ Dispute status updates to resolved
- ✅ Business owner receives notification
- ✅ If approved, review is flagged/removed
- ✅ Resolution notes saved

### 4. Response Template System Testing

#### Test 4.1: Template Creation and Management
**Objective**: Test template CRUD operations

**API Tests**:
```bash
# Create template
POST /api/templates
{
  "name": "Positive Response Template",
  "content": "Thank you {{customerName}} for your {{rating}}-star review! We're thrilled you enjoyed {{businessName}}.",
  "category": "positive",
  "isPublic": false
}

# Get templates
GET /api/templates?businessId={businessId}

# Update template
PUT /api/templates/{templateId}
{
  "content": "Updated template content with {{customerName}}"
}
```

**Frontend Steps**:
1. Go to Business Dashboard > Templates tab
2. Click "Create New Template"
3. Fill out template form:
   - Name: "Thank You Template"
   - Category: "Positive"
   - Content: "Thank you {{customerName}} for your review!"
4. Save template
5. Edit existing template
6. Test template variables

**Expected Results**:
- ✅ Template created successfully
- ✅ Variables detected automatically
- ✅ Template preview works
- ✅ Template editing functions
- ✅ Category filtering works

#### Test 4.2: Template Variable Processing
**Objective**: Test variable substitution

**Test Data**:
```javascript
Template: "Dear {{customerName}}, thank you for your {{rating}}-star review of {{businessName}}!"

Variables: {
  customerName: "John Doe",
  rating: "5", 
  businessName: "Coffee Paradise"
}

Expected Output: "Dear John Doe, thank you for your 5-star review of Coffee Paradise!"
```

**Steps**:
1. Create template with variables
2. Use template in response preview
3. Verify variables are replaced correctly
4. Test with missing variables
5. Test with special characters

**Expected Results**:
- ✅ Variables replaced correctly
- ✅ Missing variables show empty string
- ✅ Special characters handled properly

### 5. Bulk Response Tools Testing

#### Test 5.1: Eligible Reviews Filtering
**Objective**: Verify only registered user reviews are available for bulk response

**API Test**:
```bash
GET /api/bulk-response/{businessId}/eligible-reviews?filter=unresponded
```

**Steps**:
1. Ensure business has mix of anonymous and registered user reviews
2. Navigate to Business Dashboard > Bulk Response tab
3. Check available reviews list
4. Verify anonymous reviews are excluded

**Expected Results**:
- ✅ Only registered user reviews appear
- ✅ Anonymous reviews filtered out
- ✅ Review count statistics correct
- ✅ Filtering options work (unresponded, rating, etc.)

#### Test 5.2: Bulk Response Preview
**Objective**: Test response preview functionality

**Steps**:
1. Select multiple reviews for bulk response
2. Choose a response template
3. Add custom variables if needed
4. Click "Preview Responses"
5. Review generated responses
6. Modify individual responses if needed

**Expected Results**:
- ✅ Preview shows personalized responses
- ✅ Template variables processed correctly
- ✅ Individual response editing works
- ✅ Customer names and details correct

#### Test 5.3: Bulk Response Submission
**Objective**: Test actual response sending

**API Test**:
```bash
POST /api/bulk-response/{businessId}/submit
{
  "templateId": "TEMPLATE_ID",
  "responses": [
    {
      "reviewId": "REVIEW_ID_1",
      "customResponse": "Custom response text"
    },
    {
      "reviewId": "REVIEW_ID_2"
      // Uses template default
    }
  ]
}
```

**Steps**:
1. Complete preview process
2. Click "Send Responses"
3. Confirm in dialog
4. Wait for completion
5. Check response history

**Expected Results**:
- ✅ All responses sent successfully
- ✅ Reviews marked as responded
- ✅ Response history updated
- ✅ Template usage statistics incremented

### 6. Response Scheduling and Analytics Testing

#### Test 6.1: Response Scheduling
**Objective**: Test response scheduling functionality

**API Test**:
```bash
POST /api/bulk-response/{businessId}/schedule
{
  "templateId": "TEMPLATE_ID",
  "responses": [...],
  "scheduledTime": "2025-09-16T10:00:00.000Z",
  "customVariables": {}
}
```

**Frontend Steps**:
1. Go through bulk response flow
2. Instead of "Send Now", select "Schedule"
3. Choose future date/time
4. Submit scheduled response
5. Check scheduled responses list

**Expected Results**:
- ✅ Response scheduled successfully
- ✅ Appears in scheduled responses list
- ✅ Can be cancelled before execution
- ✅ Executes at scheduled time

#### Test 6.2: Analytics Dashboard
**Objective**: Test response analytics and reporting

**Steps**:
1. Navigate to Business Dashboard > Analytics tab
2. Check response statistics:
   - Total responses sent
   - Response rate percentage
   - Template usage statistics
   - Scheduling analytics
3. View charts and graphs
4. Filter by date range
5. Export data if available

**Expected Results**:
- ✅ Statistics display correctly
- ✅ Charts render properly (using Recharts)
- ✅ Data filtering works
- ✅ Template effectiveness metrics shown
- ✅ Scheduling patterns visualized

#### Test 6.3: Scheduled Response Execution
**Objective**: Verify scheduled responses execute properly

**Steps**:
1. Create a scheduled response for near future (5 minutes)
2. Wait for scheduled time
3. Check server logs for execution
4. Verify responses were sent
5. Check response history

**Expected Results**:
- ✅ Cron job executes at scheduled time
- ✅ Responses sent to correct reviews
- ✅ Template variables processed
- ✅ Statistics updated
- ✅ Schedule marked as completed

## Error Testing

### Test Error Handling

1. **Invalid Data Tests**:
   - Submit forms with missing required fields
   - Use invalid business/review IDs
   - Test with expired authentication tokens

2. **Permission Tests**:
   - Try accessing other users' businesses
   - Attempt admin functions as regular user
   - Test unauthorized API calls

3. **Network Error Tests**:
   - Test with server offline
   - Test with slow network
   - Test interrupted requests

**Expected Results**:
- ✅ Proper error messages displayed
- ✅ No system crashes
- ✅ Graceful degradation
- ✅ Security maintained

## Performance Testing

1. **Load Testing**:
   - Create businesses with 100+ reviews
   - Test bulk response with 50+ reviews
   - Test with multiple concurrent users

2. **Response Time Testing**:
   - Measure API response times
   - Test template processing speed
   - Verify analytics load quickly

## Post-Testing Verification

After completing all tests:

1. **Database Integrity**:
   ```bash
   # Check all models have proper data
   # Verify relationships are maintained
   # Confirm no orphaned records
   ```

2. **Log Analysis**:
   - Review server logs for errors
   - Check for memory leaks
   - Verify scheduler logs

3. **Security Check**:
   - Verify all endpoints require proper authentication
   - Test authorization rules
   - Check data exposure

## Test Results Template

```
## Phase 2 Testing Results

**Date**: [DATE]
**Tester**: [NAME]
**Environment**: [DEV/STAGING/PROD]

### Feature Test Results:
- [ ] Multi-Business Support: PASS/FAIL
- [ ] Review Dispute System: PASS/FAIL  
- [ ] Admin Dispute Resolution: PASS/FAIL
- [ ] Response Templates: PASS/FAIL
- [ ] Bulk Response Tools: PASS/FAIL
- [ ] Response Scheduling: PASS/FAIL
- [ ] Analytics Dashboard: PASS/FAIL

### Issues Found:
1. [Issue description]
2. [Issue description]

### Notes:
[Additional observations]
```

## Troubleshooting Common Issues

### Server Won't Start
- Check MongoDB connection
- Verify all dependencies installed
- Check for port conflicts
- Review environment variables

### Frontend Errors
- Clear browser cache
- Check console for errors
- Verify API endpoints accessible
- Check authentication state

### Database Issues
- Verify MongoDB is running
- Check connection string
- Ensure proper indexes exist
- Verify model schemas match

### Authentication Problems
- Check JWT tokens
- Verify middleware chain
- Test with fresh login
- Check token expiration

This comprehensive testing guide ensures all Phase 2 features are thoroughly validated before production deployment.