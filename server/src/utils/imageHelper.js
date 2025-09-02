const CloudinaryService = require('../services/cloudinaryService');

// Helper functions for image handling in controllers

class ImageHelper {
  
  // Handle business image uploads (logo, banner, gallery)
  static async handleBusinessImages(imageData, businessId) {
    const results = {};
    
    try {
      // Upload logo if provided
      if (imageData.logo) {
        const logoResult = await CloudinaryService.uploadImage(
          imageData.logo,
          `servisbeta/businesses/${businessId}/logo`
        );
        results.logo = logoResult.url;
      }
      
      // Upload banner if provided
      if (imageData.banner) {
        const bannerResult = await CloudinaryService.uploadImage(
          imageData.banner,
          `servisbeta/businesses/${businessId}/banner`
        );
        results.banner = bannerResult.url;
      }
      
      // Upload gallery images if provided
      if (imageData.images && Array.isArray(imageData.images)) {
        const galleryResults = await CloudinaryService.uploadMultipleImages(
          imageData.images,
          `servisbeta/businesses/${businessId}/gallery`
        );
        results.images = galleryResults.map(result => result.url);
      }
      
      return results;
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Handle user profile image upload
  static async handleUserProfileImage(imageData, userId) {
    try {
      if (imageData.profileImage) {
        const result = await CloudinaryService.uploadImage(
          imageData.profileImage,
          `servisbeta/users/${userId}/profile`
        );
        return result.url;
      }
      return null;
    } catch (error) {
      throw new Error(`Profile image upload failed: ${error.message}`);
    }
  }

  // Handle review images upload
  static async handleReviewImages(imageData, reviewId) {
    try {
      if (imageData.images && Array.isArray(imageData.images)) {
        const results = await CloudinaryService.uploadMultipleImages(
          imageData.images,
          `servisbeta/reviews/${reviewId}`
        );
        return results.map(result => ({
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height
        }));
      }
      return [];
    } catch (error) {
      throw new Error(`Review images upload failed: ${error.message}`);
    }
  }

  // Extract public ID from Cloudinary URL for deletion
  static extractPublicId(cloudinaryUrl) {
    try {
      const urlParts = cloudinaryUrl.split('/');
      const fileWithExtension = urlParts[urlParts.length - 1];
      const publicId = urlParts.slice(-3).join('/').replace(/\.[^/.]+$/, '');
      return publicId;
    } catch (error) {
      return null;
    }
  }

  // Delete business images when business is deleted
  static async deleteBusinessImages(business) {
    try {
      const publicIds = [];
      
      if (business.logo) {
        publicIds.push(this.extractPublicId(business.logo));
      }
      
      if (business.banner) {
        publicIds.push(this.extractPublicId(business.banner));
      }
      
      if (business.images && business.images.length > 0) {
        business.images.forEach(imageUrl => {
          const publicId = this.extractPublicId(imageUrl);
          if (publicId) publicIds.push(publicId);
        });
      }
      
      if (publicIds.length > 0) {
        await CloudinaryService.deleteMultipleImages(publicIds.filter(id => id));
      }
    } catch (error) {
      console.error('Error deleting business images:', error.message);
      // Don't throw error - let business deletion proceed even if image deletion fails
    }
  }

  // Delete review images when review is deleted
  static async deleteReviewImages(review) {
    try {
      if (review.images && review.images.length > 0) {
        const publicIds = review.images.map(image => 
          this.extractPublicId(image.url)
        ).filter(id => id);
        
        if (publicIds.length > 0) {
          await CloudinaryService.deleteMultipleImages(publicIds);
        }
      }
    } catch (error) {
      console.error('Error deleting review images:', error.message);
    }
  }

  // Process base64 image data
  static processBase64Image(base64Data) {
    if (!base64Data || !base64Data.includes('base64,')) {
      return null;
    }
    return base64Data;
  }

  // Validate image data structure
  static validateImageData(imageData, requiredFields = []) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!imageData[field]) {
        errors.push(`${field} is required`);
      }
    });
    
    return errors;
  }
}

module.exports = ImageHelper;
