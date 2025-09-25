# Complete ServisbetA Phase 2 Setup and Testing Guide

This is a complete step-by-step guide for setting up and testing the ServisbetA project with all Phase 2 features from scratch.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Server Setup and Start](#server-setup-and-start)
5. [Client Setup and Start](#client-setup-and-start)
6. [Creating Test Data](#creating-test-data)
7. [Feature Testing](#feature-testing)
8. [Troubleshooting](#troubleshooting)

---

## 1. Initial Setup

### Prerequisites
Before starting, ensure you have:
- **Node.js** (v16+ recommended) - [Download](https://nodejs.org/)
- **MongoDB** (Local or MongoDB Atlas) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Project Structure Verification
Your project should have this structure:
```
servisbetaProj/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root package.json
└── README.md
```

---

## 2. Environment Configuration

### Step 2.1: Server Environment Setup

1. **Navigate to server directory**:
   ```bash
   cd servisbetaProj/server
   ```

2. **Create `.env` file**:
   ```bash
   # Create .env file
   touch .env  # On Windows: type nul > .env
   ```

3. **Add environment variables to `.env`**:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/servisbeta
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/servisbeta

   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
   JWT_EXPIRE=30d

   # Server
   NODE_ENV=development
   PORT=5000

   # Email Configuration (optional for testing)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Cloudinary (for image uploads - optional for testing)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Client URL
   CLIENT_URL=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

   # File Upload
   MAX_FILE_SIZE=10485760
   ```

### Step 2.2: Client Environment Setup

1. **Navigate to client directory**:
   ```bash
   cd ../client
   ```

2. **Create `.env` file**:
   ```bash
   touch .env  # On Windows: type nul > .env
   ```

3. **Add environment variables to client `.env`**:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SERVER_URL=http://localhost:5000
   ```

---

## 3. Database Setup

### Option A: Local MongoDB

1. **Install MongoDB Community Edition**:
   - Download from [MongoDB Downloads](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB Service**:
   ```bash
   # Windows (if installed as service)
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb/brew/mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is running**:
   ```bash
   # Connect to MongoDB shell
   mongosh
   # Should connect without errors
   ```

### Option B: MongoDB Atlas (Cloud)

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create Cluster**:
   - Click "Build a Database"
   - Choose "FREE" tier
   - Select region closest to you
   - Create cluster

3. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/servisbeta
   ```

---

## 4. Server Setup and Start

### Step 4.1: Install Dependencies

1. **Navigate to server directory**:
   ```bash
   cd servisbetaProj/server
   ```

2. **Install npm packages**:
   ```bash
   npm install
   ```

3. **Verify dependencies installed**:
   ```bash
   # Should show all dependencies without errors
   npm list --depth=0
   ```

### Step 4.2: Start the Server

1. **Start in development mode**:
   ```bash
   npm run dev
   ```
   Or if you don't have nodemon:
   ```bash
   npm start
   ```

2. **Verify server is running**:
   You should see output similar to:
   ```
   Response Scheduler Service initialized
   🔧 Initializing email service...
   📧 Email Host: smtp.gmail.com:587
   👤 Email User: your-email@gmail.com
   🔍 Testing email connection...
   🚀 Server running on port 5000
   🗃️ MongoDB Connected
   ```

3. **Test server endpoint**:
   Open browser and go to: `http://localhost:5000`
   You should see:
   ```json
   {
     "success": true,
     "message": "ServisbetA API Server Running",
     "version": "1.0.0"
   }
   ```

### Step 4.3: Verify API Endpoints

Test key endpoints:
```bash
# Health check
curl http://localhost:5000/

# API health check  
curl http://localhost:5000/api

# Should return JSON responses without errors
```

---

## 5. Client Setup and Start

### Step 5.1: Install Dependencies

1. **Navigate to client directory**:
   ```bash
   cd ../client
   ```

2. **Install npm packages**:
   ```bash
   npm install
   ```

3. **Install additional dependencies** (if not already installed):
   ```bash
   npm install recharts
   ```

### Step 5.2: Start the Client

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Verify client is running**:
   - Should show: `Local: http://localhost:3000` (or similar)
   - Open browser and navigate to the URL
   - Should see the ServisbetA homepage

3. **Check for errors**:
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Verify no red error messages

---

## 6. Creating Test Data

### Step 6.1: Create User Accounts

1. **Create Regular User Account**:
   - Go to `http://localhost:3000/auth`
   - Click "Sign Up"
   - Fill out form:
     - Name: "John Customer"
     - Email: "customer@test.com" 
     - Password: "password123"
     - Role: "user"
   - Click "Sign Up"
   - Verify account created successfully

2. **Create Business Owner Account**:
   - Sign out if logged in
   - Go to sign up page
   - Fill out form:
     - Name: "Jane Business"
     - Email: "business@test.com"
     - Password: "password123" 
     - Role: "business"
   - Click "Sign Up"
   - Verify account created

3. **Create Admin Account**:
   - Sign out if logged in
   - Go to sign up page  
   - Fill out form:
     - Name: "Admin User"
     - Email: "admin@test.com"
     - Password: "password123"
     - Role: "admin"
   - Click "Sign Up"
   - Verify account created

### Step 6.2: Create Business Profiles

1. **Login as Business Owner**:
   - Email: "business@test.com"
   - Password: "password123"

2. **Create First Business**:
   - Should be redirected to create business profile
   - Fill out form:
     - Business Name: "Coffee Paradise"
     - Category: "restaurant"
     - Description: "Best coffee in town"
     - Address: "123 Main St, City, State"
     - Phone: "+1234567890"
   - Click "Create Business Profile"

3. **Create Second Business**:
   - Go to Business Dashboard
   - Click "Add New Business" 
   - Fill out form:
     - Business Name: "Pizza Corner"
     - Category: "restaurant"  
     - Description: "Authentic Italian pizza"
     - Address: "456 Oak Ave, City, State"
     - Phone: "+0987654321"
   - Click "Create Business"

4. **Verify Multiple Businesses**:
   - Check business selector dropdown
   - Should see both "Coffee Paradise" and "Pizza Corner"
   - Switch between businesses
   - Verify dashboard updates for each business

### Step 6.3: Create Sample Reviews

1. **Login as Regular User**:
   - Email: "customer@test.com"
   - Password: "password123"

2. **Create Reviews for Coffee Paradise**:
   - Go to business search or direct URL
   - Find "Coffee Paradise" business
   - Click "Write Review"
   - Create multiple reviews:
     
     **Review 1**:
     - Rating: 5 stars
     - Title: "Amazing coffee!"
     - Content: "The best coffee I've ever had. Great service and atmosphere."
     - Anonymous: No (keep unchecked)
     
     **Review 2**:
     - Rating: 4 stars  
     - Title: "Good experience"
     - Content: "Nice coffee shop with friendly staff."
     - Anonymous: No

     **Review 3**:
     - Rating: 2 stars
     - Title: "Disappointing"
     - Content: "Coffee was cold and service was slow."
     - Anonymous: No

3. **Create Anonymous Review** (for testing filtering):
   - Write another review
   - Rating: 3 stars
   - Title: "Average"
   - Content: "Nothing special"
   - Anonymous: Yes (check the box)

4. **Create Reviews for Pizza Corner**:
   - Repeat similar process for Pizza Corner business
   - Create 3-4 reviews with mix of ratings

### Step 6.4: Verify Test Data

1. **Check as Business Owner**:
   - Login as business@test.com
   - Go to Business Dashboard
   - Switch between businesses
   - Verify reviews appear for each business
   - Note which reviews are from registered vs anonymous users

2. **Database Verification** (optional):
   ```bash
   # Connect to MongoDB
   mongosh
   
   # Switch to database
   use servisbeta
   
   # Check collections
   show collections
   
   # Check users
   db.users.find().pretty()
   
   # Check businesses  
   db.businessprofiles.find().pretty()
   
   # Check reviews
   db.reviews.find().pretty()
   ```

---

## 7. Feature Testing

Now we'll test each Phase 2 feature systematically:

### Test 1: Multi-Business Support

#### Test 1.1: Business Management
1. **Login as Business Owner** (business@test.com)
2. **Verify Business Selector**:
   - ✅ Business dropdown visible in dashboard
   - ✅ Shows both businesses: "Coffee Paradise" and "Pizza Corner"
   - ✅ Current business highlighted
3. **Switch Businesses**:
   - ✅ Click dropdown and select different business
   - ✅ Dashboard content updates
   - ✅ Reviews and data change for selected business
4. **Create Additional Business**:
   - ✅ Click "Add New Business"
   - ✅ Form opens and validates properly
   - ✅ New business created and appears in selector

#### Test 1.2: API Testing
Open new terminal and test APIs:
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"business@test.com","password":"password123"}'

# Copy the token from response, then:
export TOKEN="your_jwt_token_here"

# Get user's businesses
curl -X GET http://localhost:5000/api/business/my/businesses \
  -H "Authorization: Bearer $TOKEN"

# Should return array of businesses
```

### Test 2: Response Templates

#### Test 2.1: Template Creation
1. **Go to Templates Tab**:
   - Business Dashboard > Templates
2. **Create Positive Template**:
   - Click "Create New Template"
   - Name: "Thank You Response"
   - Category: "positive"
   - Content: "Thank you {{customerName}} for your {{rating}}-star review! We're thrilled you enjoyed your experience at {{businessName}}."
   - Save template
3. **Create Negative Template**:
   - Name: "Apology Response"
   - Category: "negative"  
   - Content: "Dear {{customerName}}, we sincerely apologize for your {{rating}}-star experience. We'd love to make this right. Please contact us at {{businessName}}."
   - Save template

#### Test 2.2: Template Variables
1. **Test Variable Detection**:
   - ✅ Variables {{customerName}}, {{rating}}, {{businessName}} detected
   - ✅ Variable list shows correctly
2. **Test Preview**:
   - ✅ Preview shows processed template
   - ✅ Variables replaced with sample data

### Test 3: Bulk Response System

#### Test 3.1: Eligible Reviews
1. **Go to Bulk Response Tab**:
   - Business Dashboard > Bulk Response
2. **Verify Review Filtering**:
   - ✅ Only registered user reviews shown
   - ✅ Anonymous reviews excluded
   - ✅ Review count statistics correct
3. **Filter Options**:
   - ✅ Filter by "Unresponded" works
   - ✅ Filter by rating works
   - ✅ Sort options function

#### Test 3.2: Bulk Response Process
1. **Select Reviews**:
   - ✅ Select 2-3 unresponded reviews
   - ✅ Selection count updates
2. **Choose Template**:
   - ✅ Select "Thank You Response" template
   - ✅ Template content loads
3. **Preview Responses**:
   - ✅ Click "Preview Responses"
   - ✅ Personalized responses generated
   - ✅ Customer names and details correct
4. **Send Responses**:
   - ✅ Click "Send Responses"
   - ✅ Confirmation dialog appears
   - ✅ Responses sent successfully
   - ✅ Reviews marked as responded

### Test 4: Review Dispute System

#### Test 4.1: Create Dispute
1. **Find Negative Review**:
   - Go to Reviews tab
   - Find the 2-star "Disappointing" review
2. **Dispute Review**:
   - Click "Dispute" button on review
   - Fill out form:
     - Dispute Type: "inappropriate_content"
     - Reason: "Review contains false claims"
     - Evidence: "Customer was never in our establishment on that date"
     - Priority: "high"
   - Submit dispute
3. **Verify Dispute**:
   - ✅ Dispute created successfully
   - ✅ Review marked as disputed
   - ✅ Dispute appears in disputes list

#### Test 4.2: Dispute Communication
1. **Add Communication**:
   - Go to dispute details
   - Add message: "Additional evidence: security camera footage"
   - Submit message
2. **Update Evidence**:
   - Click "Update Evidence"
   - Add more details
   - Save changes

### Test 5: Admin Dispute Resolution

#### Test 5.1: Admin Dashboard
1. **Login as Admin** (admin@test.com)
2. **Access Admin Dashboard**:
   - Navigate to Admin Dashboard
   - ✅ Admin menu visible
   - ✅ Disputes tab accessible
3. **View Disputes**:
   - ✅ All disputes listed
   - ✅ Dispute details viewable
   - ✅ Business and review info shown

#### Test 5.2: Resolve Dispute
1. **Select Dispute**:
   - Click on the dispute created earlier
2. **Review Details**:
   - ✅ All evidence visible
   - ✅ Communication history shown
3. **Make Decision**:
   - Click "Approve" or "Reject"
   - Add resolution notes
   - Submit decision
4. **Verify Resolution**:
   - ✅ Dispute status updated
   - ✅ Business owner sees resolution
   - ✅ Review action taken (if approved)

### Test 6: Response Scheduling

#### Test 6.1: Schedule Responses
1. **Go to Bulk Response**:
   - Select reviews for response
   - Choose template
2. **Schedule Instead of Send**:
   - Click "Schedule" instead of "Send Now"
   - Choose future date/time (e.g., 5 minutes from now)
   - Submit schedule
3. **Verify Scheduling**:
   - ✅ Response scheduled successfully
   - ✅ Appears in scheduled responses list
   - ✅ Can view schedule details

#### Test 6.2: Scheduled Execution
1. **Wait for Scheduled Time**:
   - Wait for the scheduled time to pass
2. **Check Execution**:
   - ✅ Server logs show execution
   - ✅ Responses sent to reviews
   - ✅ Schedule marked as completed
   - ✅ Response history updated

### Test 7: Analytics Dashboard

#### Test 7.1: Response Analytics
1. **Go to Analytics Tab**:
   - Business Dashboard > Analytics
2. **Verify Metrics**:
   - ✅ Total responses count
   - ✅ Response rate percentage
   - ✅ Template usage statistics
3. **Check Charts**:
   - ✅ Response trends chart renders
   - ✅ Template effectiveness chart
   - ✅ Scheduling patterns visualization

#### Test 7.2: Data Filtering
1. **Date Range Filter**:
   - Select different date ranges
   - ✅ Data updates accordingly
2. **Template Filter**:
   - Filter by specific template
   - ✅ Shows template-specific metrics

---

## 8. Advanced Testing Scenarios

### Test 8.1: Error Handling
1. **Invalid Data Tests**:
   - Submit forms with missing fields
   - ✅ Proper error messages shown
   - ✅ Form validation works
2. **Permission Tests**:
   - Try accessing other user's businesses
   - ✅ Proper authorization errors
3. **Network Tests**:
   - Stop server temporarily
   - ✅ Client shows connection errors
   - ✅ Graceful error handling

### Test 8.2: Performance Testing
1. **Large Data Sets**:
   - Create business with 50+ reviews
   - Test bulk response with many reviews
   - ✅ System handles load well
2. **Response Times**:
   - Measure API response times
   - ✅ All responses under 2 seconds
   - ✅ Analytics load quickly

---

## 9. Troubleshooting

### Common Issues and Solutions

#### Server Won't Start
**Problem**: `npm start` fails or server crashes
**Solutions**:
1. Check MongoDB is running:
   ```bash
   # Test MongoDB connection
   mongosh
   ```
2. Verify environment variables:
   ```bash
   # Check .env file exists and has correct values
   cat server/.env
   ```
3. Check for port conflicts:
   ```bash
   # Kill process using port 5000
   npx kill-port 5000
   ```
4. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

#### Client Won't Start
**Problem**: React app fails to start
**Solutions**:
1. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check environment variables:
   ```bash
   cat client/.env
   ```
3. Check for TypeScript errors:
   ```bash
   npm run build
   ```

#### Database Connection Issues
**Problem**: MongoDB connection fails
**Solutions**:
1. **Local MongoDB**:
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod  # Linux
   brew services start mongodb-community  # macOS
   net start MongoDB  # Windows
   ```
2. **MongoDB Atlas**:
   - Check connection string format
   - Verify username/password
   - Check IP whitelist in Atlas

#### Authentication Issues  
**Problem**: Login fails or tokens invalid
**Solutions**:
1. Clear browser localStorage:
   ```javascript
   // In browser console
   localStorage.clear()
   ```
2. Check JWT_SECRET in server .env
3. Verify user creation in database

#### API Errors
**Problem**: API calls return errors
**Solutions**:
1. Check server logs for specific errors
2. Verify request format and headers
3. Test with curl or Postman:
   ```bash
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

#### Frontend Errors
**Problem**: React components don't load or crash
**Solutions**:
1. Check browser console for errors
2. Verify all dependencies installed:
   ```bash
   npm install recharts  # For analytics charts
   ```
3. Check component imports and exports

### Debug Mode

#### Server Debug Mode
```bash
# Run with debug logging
DEBUG=* npm run dev

# Or specific debug namespace
DEBUG=app:* npm run dev
```

#### Client Debug Mode
```bash
# Run with verbose logging
VITE_DEBUG=true npm run dev
```

### Logging

#### Server Logs
Check console output for:
- Database connection status
- API request/response logs
- Error messages and stack traces
- Scheduler execution logs

#### Client Logs
Check browser DevTools:
- Console tab for JavaScript errors
- Network tab for failed API calls
- Application tab for localStorage issues

---

## 10. Success Criteria Checklist

After completing all tests, verify:

### ✅ Core Functionality
- [ ] Server starts without errors
- [ ] Client connects to server successfully
- [ ] Database connection established
- [ ] User authentication works
- [ ] Business creation and management works

### ✅ Phase 2 Features
- [ ] Multiple businesses per user supported
- [ ] Business switching works seamlessly
- [ ] Response templates create and process correctly
- [ ] Bulk responses work with registered users only
- [ ] Anonymous reviews properly excluded
- [ ] Review disputes create and track properly
- [ ] Admin dispute resolution functions
- [ ] Response scheduling executes correctly
- [ ] Analytics dashboard displays data

### ✅ User Experience
- [ ] All forms validate properly
- [ ] Error messages are clear and helpful
- [ ] Loading states show during operations
- [ ] Success confirmations appear
- [ ] Navigation works smoothly

### ✅ Security
- [ ] Authentication required for protected routes
- [ ] Users can only access their own data
- [ ] Admin functions restricted to admin users
- [ ] No sensitive data exposed in responses

### ✅ Performance
- [ ] Pages load in under 3 seconds
- [ ] API responses under 2 seconds
- [ ] Large data sets handled properly
- [ ] No memory leaks or crashes

---

## 11. Next Steps

Once all testing is complete and successful:

1. **Document Any Issues Found**
2. **Create Production Environment Configuration**
3. **Set Up Deployment Pipeline**
4. **Plan User Acceptance Testing**
5. **Prepare Production Data Migration**

---

## Support

If you encounter issues not covered in this guide:

1. **Check Server Logs** - Most issues show detailed error messages
2. **Review Browser Console** - Frontend issues usually logged here
3. **Test API Directly** - Use curl or Postman to isolate issues
4. **Check Database** - Connect with mongosh to verify data
5. **Clear Cache** - Browser cache or node_modules if unexpected behavior

This guide should get you from zero to a fully functional ServisbetA system with all Phase 2 features working correctly!