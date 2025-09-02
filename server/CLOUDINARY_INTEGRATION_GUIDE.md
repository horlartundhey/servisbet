# Cloudinary Integration Guide

## Overview
Cloudinary is used in ServisbetA for handling image uploads, storage, and optimization. It manages images for users, businesses, and reviews.

## Environment Variables Required

Add these to your `.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Where Cloudinary is Used

### 1. **User Profile Images**
- **Model Field**: `User.profileImage` (String - stores Cloudinary URL)
- **Usage**: User avatars and profile pictures
- **Upload Folder**: `servisbeta/users/{userId}/profile`

### 2. **Business Images**
- **Logo**: `Business.logo` (String - Cloudinary URL)
- **Banner**: `Business.banner` (String - Cloudinary URL) 
- **Gallery**: `Business.images` (Array of Cloudinary URLs)
- **Verification Documents**: `Business.verificationDocuments` (Array of Cloudinary URLs)
- **Upload Folders**:
  - Logo: `servisbeta/businesses/{businessId}/logo`
  - Banner: `servisbeta/businesses/{businessId}/banner`
  - Gallery: `servisbeta/businesses/{businessId}/gallery`

### 3. **Review Images**
- **Images**: `Review.images` (Array of objects with Cloudinary URLs)
- **Videos**: `Review.videos` (Array of objects with Cloudinary URLs)
- **Upload Folder**: `servisbeta/reviews/{reviewId}`

## Files Created for Cloudinary Integration

### 1. **Configuration**
- **File**: `src/config/cloudinary.js`
- **Purpose**: Cloudinary configuration using environment variables

### 2. **Service Layer**
- **File**: `src/services/cloudinaryService.js`
- **Functions**:
  - `uploadImage()` - Single image upload
  - `uploadMultipleImages()` - Multiple image upload
  - `deleteImage()` - Delete single image
  - `deleteMultipleImages()` - Delete multiple images
  - `updateImage()` - Replace existing image
  - `createUploadMiddleware()` - Multer middleware for direct uploads

### 3. **Utility Helper**
- **File**: `src/utils/imageHelper.js`
- **Functions**:
  - `handleBusinessImages()` - Process business image uploads
  - `handleUserProfileImage()` - Process user profile image
  - `handleReviewImages()` - Process review image uploads
  - `deleteBusinessImages()` - Clean up business images
  - `extractPublicId()` - Extract public ID from Cloudinary URL

### 4. **Upload Routes**
- **File**: `src/routes/upload.js`
- **Endpoints**:
  - `POST /api/upload/single` - Upload single image
  - `POST /api/upload/multiple` - Upload multiple images
  - `DELETE /api/upload/:publicId` - Delete image by public ID

## API Endpoints for File Upload

### Upload Single Image
```http
POST /api/upload/single
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- image: (file)
- folder: (optional) Custom folder path
```

### Upload Multiple Images  
```http
POST /api/upload/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- images: (multiple files)
- folder: (optional) Custom folder path
```

### Delete Image
```http
DELETE /api/upload/{publicId}
Authorization: Bearer {token}

Note: Replace slashes in publicId with underscores in URL
```

## How to Use in Controllers

### Example: Business Image Upload
```javascript
const ImageHelper = require('../utils/imageHelper');

// In your controller
const imageData = {
  logo: req.body.logoBase64, // Base64 image data
  banner: req.body.bannerBase64,
  images: req.body.galleryImages // Array of base64 images
};

const imageResults = await ImageHelper.handleBusinessImages(imageData, business._id);

// Update business with image URLs
business.logo = imageResults.logo || business.logo;
business.banner = imageResults.banner || business.banner;
business.images = imageResults.images || business.images;
```

## Image Optimization Features

Cloudinary automatically:
- **Resizes** images to max 800x600 pixels
- **Optimizes quality** for web delivery
- **Converts formats** (auto format selection)
- **Compresses** files for faster loading
- **Provides** responsive image URLs

## Folder Structure in Cloudinary

```
servisbeta/
├── users/
│   └── {userId}/
│       └── profile/
├── businesses/
│   └── {businessId}/
│       ├── logo/
│       ├── banner/
│       └── gallery/
└── reviews/
    └── {reviewId}/
        └── images/
```

## Installation Commands

Install required dependencies:
```bash
npm install cloudinary multer multer-storage-cloudinary
```

## Error Handling

All Cloudinary operations include proper error handling:
- Upload failures return descriptive error messages
- Deletion errors don't block main operations (business/review deletion)
- File size limits enforced (5MB per image)
- File type validation (images only)

## Security Features

- **Authentication required** for all upload operations
- **File type validation** (images only)
- **File size limits** (5MB max)
- **Automatic path sanitization**
- **Public ID obfuscation** for deletion endpoints

## Testing with Postman

Use the upload endpoints in your Postman collection to test:
1. Get auth token via login
2. Use form-data in request body
3. Upload images to get Cloudinary URLs
4. Use URLs in business/review creation

## Production Considerations

1. **Cloudinary Account**: Ensure you have sufficient storage/bandwidth
2. **Environment Variables**: Set correct production Cloudinary credentials
3. **CDN**: Cloudinary URLs are CDN-optimized automatically
4. **Backup**: Consider backup strategy for uploaded images
