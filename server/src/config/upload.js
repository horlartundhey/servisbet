const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

// Configure Cloudinary storage for review photos
const reviewPhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'servisbeta/reviews', // Organize photos in folders
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      // Optimize images for web display
      { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' },
      { fetch_format: 'auto' } // Auto-select best format (WebP when supported)
    ],
    // Generate unique filename with timestamp
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `review_${timestamp}_${random}`;
    }
  }
});

// Configure multer middleware for review photos
const uploadReviewPhotos = multer({
  storage: reviewPhotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 photos per review
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      // Additional security: check for valid image extensions
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP images are allowed.'), false);
      }
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  }
});

// Configure storage for business profile photos (separate from review photos)
const businessPhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'servisbeta/businesses',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `business_${timestamp}_${random}`;
    }
  }
});

const uploadBusinessPhotos = multer({
  storage: businessPhotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 photos for business gallery
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP images are allowed.'), false);
      }
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  }
});

// Utility function to delete image from Cloudinary
const deleteCloudinaryImage = async (imageUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileWithExtension.split('.')[0];
    const folderPath = urlParts.slice(-3, -1).join('/'); // Get folder path
    const fullPublicId = `${folderPath}/${publicId}`;
    
    const result = await cloudinary.uploader.destroy(fullPublicId);
    console.log('Image deleted from Cloudinary:', fullPublicId, result);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Utility function to optimize image URL for different sizes
const getOptimizedImageUrl = (originalUrl, transformation = {}) => {
  if (!originalUrl) return null;
  
  const defaultTransformations = {
    thumbnail: 'w_300,h_200,c_fill,q_auto,f_auto',
    medium: 'w_600,h_400,c_fill,q_auto,f_auto', 
    large: 'w_1200,h_800,c_limit,q_auto,f_auto'
  };
  
  // If transformation is a string (preset), use default transformations
  if (typeof transformation === 'string' && defaultTransformations[transformation]) {
    transformation = defaultTransformations[transformation];
  } else if (typeof transformation === 'object') {
    // Convert object to Cloudinary transformation string
    transformation = Object.entries(transformation)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
  }
  
  // Insert transformation into Cloudinary URL
  if (transformation && originalUrl.includes('/upload/')) {
    return originalUrl.replace('/upload/', `/upload/${transformation}/`);
  }
  
  return originalUrl;
};

module.exports = {
  uploadReviewPhotos,
  uploadBusinessPhotos,
  deleteCloudinaryImage,
  getOptimizedImageUrl
};