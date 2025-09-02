const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary upload utility functions
class CloudinaryService {
  
  // Upload single image from buffer/base64
  static async uploadImage(imageBuffer, folder = 'servisbeta', options = {}) {
    try {
      const result = await cloudinary.uploader.upload(imageBuffer, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' },
          { format: 'auto' }
        ],
        ...options
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(imageBuffers, folder = 'servisbeta', options = {}) {
    try {
      const uploadPromises = imageBuffers.map(buffer => 
        this.uploadImage(buffer, folder, options)
      );
      
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw new Error(`Multiple image upload failed: ${error.message}`);
    }
  }

  // Delete image by public ID
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  // Delete multiple images
  static async deleteMultipleImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new Error(`Multiple image deletion failed: ${error.message}`);
    }
  }

  // Update image (replace existing)
  static async updateImage(oldPublicId, newImageBuffer, folder = 'servisbeta', options = {}) {
    try {
      // Delete old image
      await this.deleteImage(oldPublicId);
      
      // Upload new image
      const result = await this.uploadImage(newImageBuffer, folder, options);
      return result;
    } catch (error) {
      throw new Error(`Image update failed: ${error.message}`);
    }
  }

  // Get image details
  static async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      throw new Error(`Failed to get image details: ${error.message}`);
    }
  }

  // Create multer storage for direct upload
  static createMulterStorage(folder = 'servisbeta') {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: folder,
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      }
    });
  }

  // Create multer middleware for file upload
  static createUploadMiddleware(folder = 'servisbeta', maxFiles = 5) {
    const storage = this.createMulterStorage(folder);
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || (5 * 1024 * 1024); // 5MB default
    const maxFilesPerRequest = parseInt(process.env.MAX_FILES_PER_REQUEST) || maxFiles;
    
    return multer({
      storage: storage,
      limits: {
        fileSize: maxFileSize,
        files: maxFilesPerRequest
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      }
    });
  }
}

module.exports = CloudinaryService;
