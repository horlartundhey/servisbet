# ServisbetA API Documentation

## Overview
ServisbetA is a business review platform API that allows users to search, review, and rate businesses while providing business owners with analytics and response capabilities.

## Base URL
```
http://localhost:5000/api
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format
All responses follow this format:
```json
{
  "success": true|false,
  "data": {}, // Response data
  "message": "Success message",
  "error": "Error message (if success: false)"
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123",
  "role": "user" // "user", "business", "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "userId",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": false,
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

### Login User
**POST** `/auth/login`

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
**GET** `/auth/me`
*Requires Authentication*

Get current logged-in user information.

### Update User Details
**PUT** `/auth/updatedetails`
*Requires Authentication*

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

### Update Password
**PUT** `/auth/updatepassword`
*Requires Authentication*

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

---

## Business Endpoints

### Get All Businesses
**GET** `/business`

Get list of businesses with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by business category
- `city` (string): Filter by city
- `search` (string): Search businesses by name/description
- `latitude` (number): User latitude for location-based search
- `longitude` (number): User longitude for location-based search
- `radius` (number): Search radius in meters (default: 10000)
- `sortBy` (string): Sort field (default: 'createdAt')
- `order` (string): Sort order 'asc' or 'desc' (default: 'desc')

### Get Single Business
**GET** `/business/:id`

Get detailed information about a specific business.

### Create Business
**POST** `/business`
*Requires Authentication (Business role)*

Create a new business profile.

**Request Body:**
```json
{
  "name": "My Business",
  "category": "Restaurant",
  "description": "Great food and service",
  "email": "business@example.com",
  "phone": "+1234567890",
  "website": "https://mybusiness.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY", 
    "country": "USA",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "logo": "cloudinary_url",
  "images": ["image1_url", "image2_url"]
}
```

### Update Business
**PUT** `/business/:id`
*Requires Authentication (Owner or Admin)*

### Delete Business
**DELETE** `/business/:id`
*Requires Authentication (Owner or Admin)*

### Get My Businesses
**GET** `/business/my-businesses`
*Requires Authentication (Business role)*

### Get Business Analytics
**GET** `/business/:id/analytics`
*Requires Authentication (Owner or Admin)*

---

## Review Endpoints

### Get Business Reviews
**GET** `/review/business/:businessId`

Get all reviews for a specific business.

**Query Parameters:**
- `page`, `limit`: Pagination
- `sortBy`: Sort field (default: 'createdAt')
- `sortOrder`: 'asc' or 'desc' (default: 'desc')
- `minRating`, `maxRating`: Rating filters

### Create Review
**POST** `/review`
*Requires Authentication (User role)*

**Request Body:**
```json
{
  "business": "businessId",
  "rating": 5,
  "title": "Great experience!",
  "content": "Detailed review content...",
  "images": ["image1_url", "image2_url"],
  "videos": ["video1_url"]
}
```

### Update Review
**PUT** `/review/:id`
*Requires Authentication (Review owner)*

### Delete Review
**DELETE** `/review/:id`
*Requires Authentication (Review owner or Admin)*

### Get My Reviews
**GET** `/review/my-reviews`
*Requires Authentication*

### Add Business Response
**POST** `/review/:id/response`
*Requires Authentication (Business owner or Admin)*

**Request Body:**
```json
{
  "content": "Thank you for your feedback!"
}
```

### Mark Review as Helpful
**POST** `/review/:id/helpful`
*Requires Authentication*

### Remove Helpful Mark
**DELETE** `/review/:id/helpful`
*Requires Authentication*

---

## Admin Endpoints
*All admin endpoints require Authentication with Admin role*

### Get Dashboard Stats
**GET** `/admin/dashboard`

### Get System Analytics
**GET** `/admin/analytics`

**Query Parameters:**
- `period` (number): Days to analyze (default: 30)

### Get All Users
**GET** `/admin/users`

**Query Parameters:**
- `page`, `limit`: Pagination
- `role`: Filter by user role
- `search`: Search by name/email

### Update User Status
**PUT** `/admin/users/:id/status`

**Request Body:**
```json
{
  "status": "active" // "active", "suspended", "banned"
}
```

### Get All Businesses (Admin)
**GET** `/admin/businesses`

### Update Business Status
**PUT** `/admin/businesses/:id/status`

**Request Body:**
```json
{
  "status": "active", // "active", "suspended", "banned"
  "verificationStatus": "approved" // "pending", "approved", "rejected"
}
```

### Get Flagged Reviews
**GET** `/admin/reviews/flagged`

### Moderate Review
**PUT** `/admin/reviews/:id/moderate`

**Request Body:**
```json
{
  "action": "approve", // "approve", "remove"
  "reason": "Review meets community guidelines"
}
```

---

## Subscription Endpoints

### Create Subscription
**POST** `/subscription`
*Requires Authentication (Business role)*

**Request Body:**
```json
{
  "business": "businessId",
  "plan": "premium", // "paid", "premium", "custom"
  "endDate": "2024-12-31T23:59:59.000Z"
}
```

### Get Business Subscriptions
**GET** `/subscription/business/:businessId`
*Requires Authentication (Business owner)*

---

## Flag Endpoints

### Flag Review
**POST** `/flag`
*Requires Authentication*

**Request Body:**
```json
{
  "review": "reviewId",
  "reason": "Inappropriate content"
}
```

### Get All Flags (Admin)
**GET** `/flag`
*Requires Authentication (Admin role)*

---

## Error Codes

- **400** - Bad Request (validation errors, missing fields)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

---

## Rate Limiting
API requests are limited to prevent abuse. Current limits:
- 100 requests per 15 minutes per IP
- 1000 requests per hour for authenticated users

---

## Testing
Use the provided Postman collection to test all endpoints. The collection includes:
- Environment variables for base URL and authentication token
- Pre-configured requests for all endpoints
- Test scripts for token management
