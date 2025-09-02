# ServisbetA API Testing Checklist

## Pre-Testing Setup

### 1. Environment Preparation
- [ ] ✅ `.env` file configured with all required variables
- [ ] ✅ MongoDB connection string valid and accessible
- [ ] ✅ Cloudinary credentials added and verified
- [ ] ✅ Dependencies installed (`npm install`)
- [ ] 🔄 **Seed database with test data** (`node seedData.js`)
- [ ] 🔄 **Start server** (`npm start`)

### 2. Test Accounts Available After Seeding
```
🔑 Admin: admin@servisbeta.com / admin123456
👤 Business: business@servisbeta.com / business123456  
👤 Customer: customer@servisbeta.com / customer123456
👤 Reviewer: reviewer@servisbeta.com / reviewer123456
👤 Restaurant: restaurant@servisbeta.com / restaurant123456
```

---

## Phase 1: Basic Server & Database Connectivity

### Server Health
- [ ] **GET /** - Health check endpoint responds
- [ ] **Server starts** without errors on port 5000
- [ ] **MongoDB connection** established successfully
- [ ] **Environment variables** loading correctly

---

## Phase 2: Authentication System Testing

### User Registration
- [ ] **POST /api/auth/register** - Register new user (role: user)
- [ ] **POST /api/auth/register** - Register business owner (role: business)
- [ ] **POST /api/auth/register** - Register admin (role: admin)
- [ ] **Validate** - Duplicate email rejection
- [ ] **Validate** - Required field validation
- [ ] **Validate** - Password hashing verification
- [ ] **Validate** - JWT token generation

### User Login
- [ ] **POST /api/auth/login** - Login with valid credentials
- [ ] **POST /api/auth/login** - Login with invalid email
- [ ] **POST /api/auth/login** - Login with invalid password
- [ ] **Validate** - JWT token returned and valid
- [ ] **Validate** - User data returned (without password)

### Protected Routes Access
- [ ] **GET /api/auth/me** - Get current user profile
- [ ] **PUT /api/auth/updatedetails** - Update user profile
- [ ] **PUT /api/auth/updatepassword** - Update password
- [ ] **Validate** - Unauthorized access (401) without token
- [ ] **Validate** - Invalid token handling
- [ ] **Validate** - Token expiration handling

---

## Phase 3: Business Management Testing

### Public Business Access
- [ ] **GET /api/business** - Get all businesses (public)
- [ ] **GET /api/business?category=Restaurant** - Filter by category
- [ ] **GET /api/business?city=New York** - Filter by city
- [ ] **GET /api/business?search=Italian** - Search functionality
- [ ] **GET /api/business/:id** - Get single business details
- [ ] **Validate** - Pagination works correctly
- [ ] **Validate** - Sorting options function

### Business Management (Auth Required)
- [ ] **POST /api/business** - Create new business (business role)
- [ ] **PUT /api/business/:id** - Update own business
- [ ] **GET /api/business/my/businesses** - Get user's businesses
- [ ] **GET /api/business/:id/analytics** - Business analytics
- [ ] **Validate** - Only business owners can create businesses
- [ ] **Validate** - Only owners can update their businesses
- [ ] **Validate** - Location/coordinates handling
- [ ] **Validate** - Business hours validation

### Business Ownership & Permissions
- [ ] **Test** - User cannot update someone else's business (403)
- [ ] **Test** - Regular users cannot access business analytics
- [ ] **Test** - Business verification status affects visibility

---

## Phase 4: Review System Testing

### Public Review Access
- [ ] **GET /api/review/business/:businessId** - Get business reviews
- [ ] **Validate** - Pagination and sorting work
- [ ] **Validate** - Reviews display correctly

### Review Management (Auth Required)
- [ ] **POST /api/review** - Create new review
- [ ] **PUT /api/review/:id** - Update own review
- [ ] **GET /api/review/my-reviews** - Get user's reviews
- [ ] **POST /api/review/:id/helpful** - Mark review helpful
- [ ] **Validate** - Rating validation (1-5)
- [ ] **Validate** - User can only review each business once
- [ ] **Validate** - Users can only update their own reviews

### Business Response to Reviews
- [ ] **POST /api/review/:id/response** - Business owner responds to review
- [ ] **Validate** - Only business owners can respond
- [ ] **Validate** - Only owners of reviewed business can respond
- [ ] **Validate** - Response appears in review data

### Review Analytics
- [ ] **Verify** - Business average rating updates automatically
- [ ] **Verify** - Total review count updates
- [ ] **Verify** - Helpful votes count correctly

---

## Phase 5: File Upload System Testing

### Image Upload Endpoints
- [ ] **POST /api/upload/single** - Upload single image
- [ ] **POST /api/upload/multiple** - Upload multiple images
- [ ] **DELETE /api/upload/:publicId** - Delete uploaded image
- [ ] **Validate** - File type restrictions (images only)
- [ ] **Validate** - File size limits (5MB)
- [ ] **Validate** - Cloudinary integration working

### Image Integration Testing
- [ ] **Test** - Upload business logo during business creation
- [ ] **Test** - Upload business gallery images
- [ ] **Test** - Upload review images
- [ ] **Test** - Upload user profile image
- [ ] **Validate** - Images accessible via Cloudinary URLs
- [ ] **Validate** - Image deletion works correctly

---

## Phase 6: Admin Panel Testing

### Admin Dashboard
- [ ] **GET /api/admin/dashboard** - Admin dashboard stats
- [ ] **GET /api/admin/analytics** - System analytics
- [ ] **Validate** - Only admin role can access
- [ ] **Validate** - Correct statistics displayed

### User Management
- [ ] **GET /api/admin/users** - Get all users
- [ ] **Validate** - Pagination works
- [ ] **Validate** - User filtering options
- [ ] **Validate** - User details displayed correctly

### Business Management
- [ ] **GET /api/admin/businesses** - Get all businesses
- [ ] **Validate** - Business verification status
- [ ] **Validate** - Business analytics data
- [ ] **Validate** - Admin can modify business status

### Review Moderation
- [ ] **GET /api/admin/reviews/flagged** - Get flagged reviews
- [ ] **PUT /api/admin/reviews/:id/moderate** - Moderate review
- [ ] **Validate** - Admin can approve/reject reviews
- [ ] **Validate** - Moderation affects review visibility

---

## Phase 7: Advanced Features Testing

### Subscription System
- [ ] **POST /api/subscription** - Create subscription
- [ ] **GET /api/subscription/business/:businessId** - Get business subscriptions
- [ ] **Validate** - Subscription features activation
- [ ] **Validate** - Subscription expiration handling

### Flag System
- [ ] **POST /api/flag** - Flag inappropriate review
- [ ] **GET /api/flag** - Get all flags (admin only)
- [ ] **Validate** - Flag reasons and handling
- [ ] **Validate** - Flagged content moderation flow

### Geolocation Features
- [ ] **Test** - Location-based business search
- [ ] **Test** - Distance calculations work correctly
- [ ] **Test** - Map coordinates storage and retrieval

---

## Phase 8: Security & Validation Testing

### Authentication Security
- [ ] **Test** - Password hashing works correctly
- [ ] **Test** - JWT tokens expire properly
- [ ] **Test** - Unauthorized access blocked (401)
- [ ] **Test** - Insufficient permissions blocked (403)
- [ ] **Test** - SQL injection prevention

### Data Validation
- [ ] **Test** - Required field validation
- [ ] **Test** - Data type validation
- [ ] **Test** - Email format validation
- [ ] **Test** - Business hours format validation
- [ ] **Test** - Rating range validation (1-5)

### CORS & Headers
- [ ] **Test** - CORS policy allows frontend access
- [ ] **Test** - Proper HTTP status codes returned
- [ ] **Test** - Error messages are descriptive

---

## Phase 9: Performance & Edge Cases

### Error Handling
- [ ] **Test** - Invalid MongoDB ObjectId handling
- [ ] **Test** - Non-existent resource (404) handling
- [ ] **Test** - Server error (500) handling
- [ ] **Test** - Malformed request data handling

### Performance Testing
- [ ] **Test** - Large dataset pagination
- [ ] **Test** - Multiple concurrent requests
- [ ] **Test** - File upload limits and timeouts
- [ ] **Test** - Database query optimization

### Edge Cases
- [ ] **Test** - Empty database responses
- [ ] **Test** - Special characters in search
- [ ] **Test** - Business with no reviews
- [ ] **Test** - User with no activity

---

## Phase 10: Integration Testing

### End-to-End User Workflows
- [ ] **Workflow 1**: User Registration → Business Creation → Review Addition
- [ ] **Workflow 2**: Customer Login → Search Business → Add Review → Mark Helpful
- [ ] **Workflow 3**: Business Owner → Respond to Reviews → Check Analytics
- [ ] **Workflow 4**: Admin → View Dashboard → Moderate Content → Manage Users

### Cross-Feature Testing
- [ ] **Test** - Business rating updates after new reviews
- [ ] **Test** - User activity affects dashboard statistics
- [ ] **Test** - Subscription features unlock correctly
- [ ] **Test** - Image uploads integrate with business profiles

---

## Testing Tools & Commands

### Start Testing
```bash
# 1. Seed the database
node seedData.js

# 2. Start the server
npm start

# 3. Import Postman collection
# Import: ServisbetA_API_Collection.postman_collection.json
# Import: ServisbetA_Environment.postman_environment.json
```

### Database Reset (if needed)
```bash
# Re-run seed script to reset data
node seedData.js
```

### Monitoring During Tests
- [ ] **Check** - Server console for errors
- [ ] **Check** - MongoDB connection status
- [ ] **Check** - Cloudinary upload confirmations
- [ ] **Check** - JWT token validation messages

---

## Success Criteria

### ✅ Basic Functionality
- All authentication endpoints work
- CRUD operations for businesses and reviews
- File uploads to Cloudinary successful
- Admin panel accessible and functional

### ✅ Security
- Proper role-based access control
- Data validation prevents invalid inputs
- Unauthorized access properly blocked

### ✅ Integration
- Database operations complete successfully
- External services (Cloudinary) integration works
- Cross-feature functionality operates correctly

### ✅ Performance
- Reasonable response times
- Pagination handles large datasets
- Error handling provides useful feedback

---

## Common Issues & Troubleshooting

### Connection Issues
- **MongoDB**: Check connection string and network access
- **Cloudinary**: Verify credentials and quota limits
- **CORS**: Ensure frontend URL in ALLOWED_ORIGINS

### Authentication Issues
- **JWT**: Verify JWT_SECRET is consistent
- **Tokens**: Check token expiration settings
- **Permissions**: Verify role-based access control

### File Upload Issues
- **Size Limits**: Check MAX_FILE_SIZE setting
- **Format**: Ensure only image files uploaded
- **Cloudinary**: Verify API credentials and quotas

Ready to start testing! 🚀
