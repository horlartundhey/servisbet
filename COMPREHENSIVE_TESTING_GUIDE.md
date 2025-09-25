# ServisBeta - Complete Feature Testing Guide

## 🎯 **Testing Overview**
This guide provides step-by-step flows to test all implemented features in ServisBeta, including the core Phase 1 functionality and advanced features like real-time notifications, templates, and analytics.

---

## 🚀 **Getting Started - Environment Setup**

### Prerequisites
1. **Start the Server**
   ```bash
   cd server
   npm start
   ```
   ✅ Server should be running on `http://localhost:5000`

2. **Start the Client**
   ```bash
   cd client
   npm run dev
   ```
   ✅ Client should be running on `http://localhost:5173`

3. **Test Database Connection**
   - Check server logs for MongoDB connection success
   - Verify no critical errors in console

---

## 📝 **User Flow 1: Complete User Registration & Authentication**

### Test User Registration
1. **Navigate to Registration**
   - Go to `http://localhost:5173`
   - Click "Sign Up" or "Get Started"
   - Or directly visit `/auth`

2. **Register New User Account**
   - Enter details:
     - First Name: `John`
     - Last Name: `Doe`
     - Email: `john.doe@example.com`
     - Password: `SecurePass123!`
   - Click "Sign Up"
   - ✅ **Expected**: Success message, redirect to email verification

3. **Test Email Verification** (Mock)
   - Check server logs for verification email
   - ✅ **Expected**: Email verification link generated
   - Note: In development, check console for verification token

4. **Test User Login**
   - Go to `/auth`
   - Click "Sign In" tab
   - Enter credentials:
     - Email: `john.doe@example.com`
     - Password: `SecurePass123!`
   - Click "Sign In"
   - ✅ **Expected**: Login success, redirect to dashboard

5. **Verify Authentication State**
   - Check header shows user avatar/name
   - Verify "Sign Out" option available
   - ✅ **Expected**: User is logged in, proper UI updates

---

## 🏢 **User Flow 2: Business Registration & Management**

### Test Business Registration
1. **Access Business Registration**
   - While logged in as user, click "For Business" in header
   - Or visit `/business-dashboard`
   - Click "Create New Business" or "+" button

2. **Create Business Profile**
   - Fill out business form:
     - Name: `Tony's Pizza Palace`
     - Description: `Authentic Italian pizza with fresh ingredients`
     - Category: `restaurant`
     - Email: `info@tonyspizza.com`
     - Phone: `(555) 123-4567`
     - Website: `https://tonyspizza.com`
     - Address:
       - Street: `123 Main Street`
       - City: `New York`
       - State: `NY`
       - Zip: `10001`
       - Country: `United States`
   - Click "Create Business"
   - ✅ **Expected**: Business created successfully, appears in dashboard

3. **Test Business Profile Management**
   - Select the created business
   - Navigate to "Business Profile" tab
   - Edit any field (e.g., description)
   - Click "Save Changes"
   - ✅ **Expected**: Changes saved successfully

4. **Test Multi-Business Support**
   - Click "Create New Business" again
   - Create second business: `Joe's Coffee Corner`
   - ✅ **Expected**: Both businesses appear in dropdown

---

## ⭐ **User Flow 3: Review System Testing**

### Test Anonymous Review Creation
1. **Find Business to Review**
   - Go to homepage (`/`)
   - Search for "pizza" or browse businesses
   - Click on `Tony's Pizza Palace`
   - Click "Write a Review"

2. **Create Anonymous Review with Photos**
   - Fill out review form:
     - Rating: `5 stars` (click 5th star)
     - Title: `Amazing pizza experience!`
     - Review: `Best margherita pizza I've ever had. Fresh ingredients, perfect crust, great service. Will definitely return!`
     - Name: `Alice Smith`
     - Email: `alice.smith@email.com`
   - **Test Photo Upload**:
     - Click "Click to upload photos"
     - Select 1-2 images from your computer
     - ✅ **Expected**: Images appear as thumbnails
     - Try removing one image (X button)
     - ✅ **Expected**: Image removed successfully
   - Click "Submit Review"
   - ✅ **Expected**: Success message, email verification notice

3. **Test Review Verification** (Mock)
   - Check server console for verification email
   - ✅ **Expected**: Verification email with token generated
   - Note: In production, user would click email link

### Test Authenticated Review Creation
1. **Login as Different User**
   - Register/login as `jane.doe@example.com`
   
2. **Write Authenticated Review**
   - Search and visit `Tony's Pizza Palace`
   - Click "Write a Review"
   - Fill out form (similar to above)
   - ✅ **Expected**: No email required, direct submission

3. **View Review on Business Page**
   - Go back to business detail page
   - ✅ **Expected**: See your review displayed
   - ✅ **Expected**: See review count updated

---

## 👍 **User Flow 4: Review Helpfulness Voting**

### Test Voting System
1. **Find Review to Vote On**
   - Visit business page with reviews
   - Find a review (not your own)

2. **Test Helpful Voting**
   - Click "Helpful" button (thumbs up)
   - ✅ **Expected**: Button becomes filled/active
   - ✅ **Expected**: Counter increases by 1
   - ✅ **Expected**: Success toast appears

3. **Test Vote Removal**
   - Click "Helpful" button again (now active)
   - ✅ **Expected**: Button becomes inactive
   - ✅ **Expected**: Counter decreases by 1
   - ✅ **Expected**: "Vote removed" toast appears

4. **Test Authentication Check**
   - Log out
   - Try to vote on a review
   - ✅ **Expected**: "Please sign in" error message

---

## 🔍 **User Flow 5: Advanced Search & Filtering**

### Test Basic Search
1. **Search for Businesses**
   - Go to homepage
   - Enter "pizza" in search bar
   - Click search or press Enter
   - ✅ **Expected**: Results page with pizza businesses

2. **Test Search Filters**
   - On search results page, click "Filters" button
   - **Test Category Filter**:
     - Select "Restaurants" category
     - Click "Apply Filters"
     - ✅ **Expected**: Only restaurant results shown
   
   - **Test Rating Filter**:
     - Select "4+ stars" minimum rating
     - Apply filters
     - ✅ **Expected**: Only high-rated businesses shown
   
   - **Test Location Filter**:
     - Enter "New York" in location field
     - Apply filters
     - ✅ **Expected**: Location filter badge appears
   
   - **Test Sort Options**:
     - Change sort to "Highest Rated"
     - ✅ **Expected**: Results reordered by rating

3. **Test Filter Management**
   - ✅ **Expected**: Active filters show as badges
   - Click "X" on any filter badge
   - ✅ **Expected**: Filter removed, results update
   - Click "Clear all" filters
   - ✅ **Expected**: All filters cleared

---

## 👤 **User Flow 6: User Profile & Review History**

### Test Profile Access
1. **Access User Profile**
   - While logged in, click user avatar in header
   - Select "Profile" or visit `/profile`
   - ✅ **Expected**: Profile page loads with user info

2. **Test Profile Statistics**
   - ✅ **Expected**: See statistics: total reviews, avg rating, helpful votes, photos
   - ✅ **Expected**: User badges displayed if earned

3. **Test Review History**
   - Click "My Reviews" tab
   - ✅ **Expected**: List of all user's reviews
   - ✅ **Expected**: Business links work correctly
   - Click on business name
   - ✅ **Expected**: Navigates to business page

4. **Test Profile Editing**
   - Click edit icon next to name
   - Change first/last name
   - Click "Save Changes"
   - ✅ **Expected**: Profile updated successfully

5. **Test Activity Tab**
   - Click "Recent Activity" tab
   - ✅ **Expected**: Timeline of recent reviews and actions

---

## 🏢 **User Flow 7: Business Dashboard & Response Templates**

### Test Business Dashboard
1. **Access Business Dashboard**
   - Login as business owner
   - Visit `/business-dashboard`
   - Select your business from dropdown

2. **Test Review Management**
   - Click "Reviews" tab
   - ✅ **Expected**: See all reviews for your business
   - ✅ **Expected**: Response options available for each review

3. **Test Response Templates**
   - Click "Response Templates" tab
   - ✅ **Expected**: See template management interface

4. **Create New Template**
   - Click "Create New Template"
   - Fill out form:
     - Name: `Thank You - Positive`
     - Category: `appreciation`
     - Content: `Thank you so much for your wonderful review! We're thrilled you enjoyed your experience with us.`
   - Click "Save Template"
   - ✅ **Expected**: Template created and appears in list

5. **Test Template Usage**
   - Go back to "Reviews" tab
   - Find a review without response
   - Click "Respond" or response area
   - ✅ **Expected**: Template selector appears
   - Select your created template
   - ✅ **Expected**: Template text fills response area
   - Edit if needed and submit response
   - ✅ **Expected**: Response posted successfully

---

## 📊 **User Flow 8: Advanced Analytics Dashboard**

### Test Analytics Access
1. **Access Analytics**
   - In business dashboard, click "Analytics" tab
   - Or visit `/analytics` directly
   - ✅ **Expected**: Comprehensive analytics dashboard loads

2. **Test Overview Metrics**
   - ✅ **Expected**: Key metrics displayed (total reviews, avg rating, response rate, etc.)
   - ✅ **Expected**: Trend indicators (up/down arrows)

3. **Test Interactive Charts**
   - **Rating Distribution**: 
     - ✅ **Expected**: Pie chart shows rating breakdown
   - **Response Time Chart**:
     - ✅ **Expected**: Bar chart shows response time distribution

4. **Test Template Performance Tab**
   - Click "Template Performance" tab
   - ✅ **Expected**: Template usage statistics
   - ✅ **Expected**: Performance table with ratings and response times

5. **Test Trends Analysis**
   - Click "Trends" tab
   - ✅ **Expected**: Time-series charts for reviews and ratings
   - ✅ **Expected**: Response performance trends

6. **Test Time Range Filters**
   - Change time range from "30 days" to "7 days"
   - ✅ **Expected**: All charts update with new data range

---

## 🔔 **User Flow 9: Real-Time Notifications**

### Test Notification System
1. **Setup Real-Time Connection**
   - Ensure business owner is logged in
   - Open business dashboard
   - ✅ **Expected**: Notification bell appears in header

2. **Test New Review Notifications**
   - In separate browser/incognito, create anonymous review for the business
   - On business owner's browser:
   - ✅ **Expected**: Notification bell shows red badge
   - ✅ **Expected**: New review notification appears
   - Click notification bell
   - ✅ **Expected**: Notification center opens with new review alert

3. **Test Notification Interactions**
   - Click on a notification
   - ✅ **Expected**: Navigates to relevant page (business reviews)
   - Mark notification as read
   - ✅ **Expected**: Notification marked as read
   - Click "Mark all as read"
   - ✅ **Expected**: All notifications cleared

---

## 🚀 **User Flow 10: Bulk Response Management**

### Test Bulk Responses
1. **Access Bulk Response Tool**
   - In business dashboard, click "Bulk Responses" tab
   - ✅ **Expected**: Bulk response interface loads

2. **Create Bulk Response**
   - Select multiple reviews (if available)
   - Choose a template from dropdown
   - ✅ **Expected**: Preview shows selected template
   - Click "Send Responses"
   - ✅ **Expected**: Success message, responses posted to selected reviews

---

## 🛠 **User Flow 11: Error Handling & Edge Cases**

### Test Error Scenarios
1. **Network Errors**
   - Temporarily disable internet
   - Try to submit a form
   - ✅ **Expected**: Appropriate error message shown

2. **Authentication Expiry**
   - Manually clear auth token from localStorage
   - Try to access protected page
   - ✅ **Expected**: Redirected to login page

3. **Form Validation**
   - Try submitting forms with missing required fields
   - ✅ **Expected**: Validation errors displayed

4. **File Upload Limits**
   - Try uploading more than 5 photos to a review
   - ✅ **Expected**: Error message about photo limit

---

## 📱 **User Flow 12: Responsive Design Testing**

### Test Mobile Experience
1. **Mobile Navigation**
   - Open developer tools, switch to mobile view
   - ✅ **Expected**: Responsive design adapts properly
   - ✅ **Expected**: Mobile-friendly navigation

2. **Mobile Forms**
   - Test review creation on mobile
   - ✅ **Expected**: Forms work well on small screens
   - ✅ **Expected**: Touch-friendly buttons and inputs

---

## ✅ **Success Criteria Summary**

### Core Features (Must Work)
- [ ] User registration and authentication
- [ ] Business profile creation and management
- [ ] Review creation with photo upload
- [ ] Review voting system
- [ ] Advanced search with filters
- [ ] User profile with review history

### Advanced Features (Should Work)
- [ ] Real-time notifications
- [ ] Response templates system
- [ ] Advanced analytics dashboard
- [ ] Bulk response management
- [ ] Error handling and validation

### Performance & UX
- [ ] Page load times under 3 seconds
- [ ] Smooth interactions and transitions
- [ ] Responsive design on all devices
- [ ] Clear error messages and feedback

---

## 🐛 **Common Issues & Troubleshooting**

### If Features Don't Work:
1. **Check Console Logs**: Browser developer tools and server console
2. **Verify Database**: Ensure MongoDB is running and connected
3. **Authentication Issues**: Clear localStorage and re-login
4. **API Endpoints**: Verify server routes are properly configured
5. **CORS Issues**: Check server CORS configuration

### Mock Data Note:
Some features may use mock data in development. This is normal and expected behavior for features like:
- Email verification (check server console for tokens)
- Analytics data (may show sample data)
- Real-time notifications (may use simulated data)

---

## 🎯 **Expected Test Results**

After following this guide, you should have:
- ✅ 2-3 registered users
- ✅ 2-3 business profiles
- ✅ 5-10 reviews with various ratings
- ✅ Several response templates
- ✅ Working notification system
- ✅ Functional analytics dashboard
- ✅ Complete user profiles with activity

**This confirms ServisBeta is fully functional and ready for production deployment!** 🚀