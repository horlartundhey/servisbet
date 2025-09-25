/**
 * Email-Only Review System Testing Guide
 * 
 * This guide outlines how to test the new email-only verification system
 * for anonymous reviews, replacing the previous phone verification approach.
 */

# Email-Only Review System - Testing Checklist

## Overview
We have successfully migrated from phone+email verification to email-only verification for anonymous reviews.

## Key Changes Made
✅ **Backend Updates:**
- Updated Review model to require email, removed phone fields
- Modified reviewController.js to handle email-only verification
- Updated API routes to remove phone verification endpoints
- Added resend email verification endpoint

✅ **Frontend Updates:**
- Updated WriteReview.tsx to collect email instead of phone
- Replaced PhoneVerification component with EmailVerification component
- Updated reviewService to use email verification methods
- Created VerifyEmail.tsx for verification link handling
- Updated routing to support anonymous reviews and email verification

## Testing Steps

### 1. Anonymous Review Submission
1. Navigate to any business page
2. Click "Write Review"
3. Fill out the review form with:
   - Rating (required)
   - Review content (required)
   - Your name (required)
   - Your email address (required)
   - Optional: Title and photos
4. Submit the review
5. **Expected:** Email verification screen appears

### 2. Email Verification Process
1. Check the submitted email inbox
2. Look for verification email from the system
3. Click the verification link in the email
4. **Expected:** Redirected to success page showing "Email Verified!"
5. **Expected:** Review is now published and visible on business page

### 3. Email Verification Edge Cases
1. **Resend Email Test:**
   - Submit review but don't verify immediately
   - Click "Resend Verification Email"
   - **Expected:** New email sent successfully

2. **Invalid Token Test:**
   - Manually visit `/verify-email/invalid-token`
   - **Expected:** Error page showing verification failed

3. **Expired Token Test:**
   - Wait for token to expire (if configured)
   - Try to verify with expired token
   - **Expected:** Error message about expired link

### 4. Form Validation
1. Try submitting without email
2. Try submitting with invalid email format
3. **Expected:** Proper validation errors shown

### 5. API Endpoints to Test

#### POST /api/review/anonymous
```json
{
  "business": "business_id_here",
  "rating": 5,
  "title": "Great service",
  "content": "Really enjoyed the experience",
  "reviewerName": "John Doe",
  "reviewerEmail": "john@example.com"
}
```

#### GET /api/review/verify/:token
- Test with valid verification token
- Test with invalid token

#### POST /api/review/resend-email-verification
```json
{
  "reviewId": "review_id_here"
}
```

## URLs for Testing

### Frontend URLs
- Review Form: http://localhost:5173/write-review/{businessId}
- Email Verification: http://localhost:5173/verify-email/{token}

### API Endpoints
- Base URL: http://localhost:5000/api
- Anonymous Review: POST /review/anonymous
- Verify Email: GET /review/verify/:token
- Resend Email: POST /review/resend-email-verification

## Email Configuration
Ensure the following environment variables are set in server/.env:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=ServisbetA
```

## Success Criteria
- ✅ Users can submit anonymous reviews with email-only verification
- ✅ Verification emails are sent successfully
- ✅ Email verification links work correctly
- ✅ Reviews are published after email verification
- ✅ Confirmation emails are sent after verification
- ✅ Form validation works for email requirements
- ✅ Error handling works for invalid/expired tokens
- ✅ Resend email functionality works

## Common Issues & Solutions

### Issue: Verification emails not sending
**Solution:** Check SMTP configuration and email service logs

### Issue: Verification link not working
**Solution:** Ensure token is properly generated and routes are correct

### Issue: Form validation not working
**Solution:** Check that email validation regex is correct

### Issue: Review not publishing after verification
**Solution:** Check database updates in verification endpoint

## Next Steps After Testing
1. Update API documentation
2. Update user guides/help documentation
3. Monitor email delivery rates
4. Set up email delivery monitoring
5. Consider adding email templates customization

## Performance Notes
- Email verification is generally faster than SMS
- No additional SMS costs
- Reduced complexity in verification workflow
- Better user experience with instant email delivery