# ServisbetA API - Postman Testing Guide

## Overview
This guide explains how to test the ServisbetA API using the provided Postman collection and environment files.

## Files Included
1. `ServisbetA_API_Collection.postman_collection.json` - Complete API collection
2. `ServisbetA_Environment.postman_environment.json` - Environment variables

## Setup Instructions

### 1. Import into Postman
1. Open Postman
2. Click "Import" button
3. Import both files:
   - `ServisbetA_API_Collection.postman_collection.json`
   - `ServisbetA_Environment.postman_environment.json`
4. Select the "ServisbetA Environment" from the environment dropdown

### 2. Environment Variables
The environment includes these key variables:
- `baseUrl`: API base URL (http://localhost:5000/api)
- `authToken`: JWT token (automatically set after login)
- `businessId`: Business ID (automatically set after creating business)
- `reviewId`: Review ID (automatically set after creating review)
- `userId`: User ID (automatically set when needed)

### 3. Authentication Flow
The collection includes automatic token management:

1. **Register/Login**: Tokens are automatically saved to `authToken` variable
2. **Protected Routes**: Automatically use the stored token
3. **Token Refresh**: Re-login if token expires

## Testing Workflow

### Step 1: Authentication
1. **Register User**
   - Use "Authentication > Register User"
   - Token will be automatically saved
   
2. **Or Login Existing User**
   - Use "Authentication > Login User"
   - Token will be automatically saved

### Step 2: Create Test Data
1. **Create Business**
   - Use "Business > Create Business"
   - Business ID will be automatically saved
   
2. **Create Review**
   - Use "Reviews > Create Review"
   - Review ID will be automatically saved

### Step 3: Test All Endpoints
Now you can test all endpoints with proper authentication:

#### Business Endpoints
- Get all businesses (public)
- Get single business (public)
- Create business (requires auth)
- Update business (requires auth + ownership)
- Get my businesses (requires auth)
- Get business analytics (requires auth + ownership)

#### Review Endpoints
- Get business reviews (public)
- Create review (requires auth)
- Update review (requires auth + ownership)
- Get my reviews (requires auth)
- Add business response (requires auth + business ownership)
- Mark review helpful (requires auth)

#### Admin Endpoints (requires admin role)
- Dashboard stats
- System analytics
- Manage users
- Manage businesses
- Moderate reviews

## Pre-request Scripts
Each request includes automatic scripts that:
- Add Authorization header if token exists
- Handle token refresh if needed
- Set appropriate content-type headers

## Test Scripts
Requests include test scripts that:
- Validate response status codes
- Check response structure
- Auto-save important IDs (business, review, etc.)
- Auto-save authentication tokens

## Role-Based Testing

### User Role Tests
- Authentication endpoints ✓
- Business CRUD (own businesses only) ✓
- Review CRUD ✓
- Profile management ✓

### Business Role Tests
- All user features ✓
- Business response to reviews ✓
- Business analytics ✓
- Multiple business management ✓

### Admin Role Tests
- All user/business features ✓
- Dashboard and analytics ✓
- User management ✓
- Business management ✓
- Review moderation ✓
- System-wide statistics ✓

## Common Test Scenarios

### 1. Complete User Journey
1. Register → Login (token saved)
2. Create business (ID saved)
3. Update business details
4. View business analytics
5. Create review on another business
6. Mark other reviews as helpful

### 2. Business Owner Journey
1. Login as business owner
2. View own businesses
3. Check business analytics
4. Respond to reviews
5. Update business information

### 3. Admin Journey
1. Login as admin
2. View dashboard stats
3. Moderate flagged reviews
4. Manage users and businesses
5. View system analytics

## Error Testing
Test error scenarios:
- Invalid credentials
- Missing authentication
- Unauthorized access
- Invalid data formats
- Non-existent resources

## Environment Variables Management
- **Development**: Use localhost:5000
- **Production**: Update baseUrl to production server
- **Token Management**: Tokens auto-expire, re-login as needed
- **ID Management**: IDs are auto-saved and used in dependent requests

## Tips for Effective Testing
1. Start with authentication endpoints
2. Create test data first (users, businesses, reviews)
3. Test role-based permissions
4. Verify error handling
5. Check response formats and status codes
6. Test pagination on list endpoints
7. Verify business logic (ratings, analytics, etc.)

## Troubleshooting
- **401 Unauthorized**: Token expired, re-login
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Check if resource exists
- **500 Server Error**: Check server logs
- **Connection Error**: Ensure server is running on localhost:5000
