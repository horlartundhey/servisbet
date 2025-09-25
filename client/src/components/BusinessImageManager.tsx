import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, Eye, CheckCircle, AlertCircle, ImageIcon } from "lucide-react";
import { businessService } from '../services/businessService';

interface BusinessImages {
  logo?: string;
  cover?: string;
  gallery: string[];
}

interface BusinessImageManagerProps {
  businessId: string;
  currentImages?: BusinessImages;
  onImagesUpdated?: (images: BusinessImages) => void;
  isRequired?: boolean;
}

const BusinessImageManager: React.FC<BusinessImageManagerProps> = ({
  businessId,
  currentImages = { gallery: [] },
  onImagesUpdated,
  isRequired = true
}) => {
  const [images, setImages] = useState<BusinessImages>(currentImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MIN_GALLERY_IMAGES = 2;
  const MAX_GALLERY_IMAGES = 8;

  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  const uploadImage = async (file: File, type: 'logo' | 'cover' | 'gallery'): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    formData.append('businessId', businessId);

    // Set initial upload progress
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    
    try {
      // Get the correct auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/upload/business-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      setUploadProgress(prev => ({ ...prev, [type]: 50 }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Upload failed`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.url) {
        throw new Error(data.message || 'Invalid response from server');
      }

      setUploadProgress(prev => ({ ...prev, [type]: 100 }));
      
      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[type];
          return newProgress;
        });
      }, 1500);

      return data.data.url;
    } catch (error) {
      console.error(`Image upload error (${type}):`, error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[type];
        return newProgress;
      });
      throw error;
    }
  };

  const handleFileSelect = async (file: File, type: 'logo' | 'cover' | 'gallery') => {
    const error = validateFile(file);
    if (error) {
      setErrors(prev => ({ ...prev, [type]: error }));
      return;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, type);
      
      if (type === 'gallery') {
        setImages(prev => ({
          ...prev,
          gallery: [...prev.gallery, imageUrl]
        }));
      } else {
        setImages(prev => ({
          ...prev,
          [type]: imageUrl
        }));
      }

      // Update parent component
      const updatedImages = type === 'gallery' 
        ? { ...images, gallery: [...images.gallery, imageUrl] }
        : { ...images, [type]: imageUrl };
      
      onImagesUpdated?.(updatedImages);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      console.error(`File upload error for ${type}:`, error);
      setErrors(prev => ({ 
        ...prev, 
        [type]: errorMessage
      }));
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = images.gallery.filter((_, i) => i !== index);
    const updatedImages = { ...images, gallery: newGallery };
    setImages(updatedImages);
    onImagesUpdated?.(updatedImages);
  };

  const isComplete = () => {
    return !!(images.logo && images.cover && images.gallery.length >= MIN_GALLERY_IMAGES);
  };

  const getCompletionStatus = () => {
    const required = [
      { name: 'Logo', completed: !!images.logo },
      { name: 'Cover Image', completed: !!images.cover },
      { name: `Gallery (${MIN_GALLERY_IMAGES}+ images)`, completed: images.gallery.length >= MIN_GALLERY_IMAGES }
    ];
    
    const completed = required.filter(item => item.completed).length;
    return { completed, total: required.length, items: required };
  };

  const status = getCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Completion Status */}
      {isRequired && (
        <Alert className={isComplete() ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <div className="flex items-center space-x-2">
            {isComplete() ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            )}
            <AlertDescription className={isComplete() ? "text-green-800" : "text-yellow-800"}>
              <strong>Image Requirements:</strong> {status.completed}/{status.total} completed
              {!isComplete() && " - All images are required for business verification"}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Logo Upload */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Business Logo</span>
              {isRequired && <span className="text-red-500">*</span>}
            </CardTitle>
            {images.logo && <Badge variant="outline" className="text-green-600">✓ Uploaded</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {images.logo ? (
              <div className="relative">
                <img
                  src={images.logo}
                  alt="Business Logo"
                  className="w-32 h-32 object-cover rounded-lg border cursor-pointer"
                  onClick={() => setPreviewImage(images.logo!)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => document.getElementById('logo-input')?.click()}
                >
                  Change Logo
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload your business logo</p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo-input')?.click()}
                  disabled={uploading}
                >
                  Select Logo
                </Button>
              </div>
            )}
            
            <input
              id="logo-input"
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, 'logo');
              }}
            />
            
            {uploadProgress.logo !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.logo}%` }}
                />
              </div>
            )}
            
            {errors.logo && (
              <p className="text-sm text-red-600">{errors.logo}</p>
            )}
            
            <p className="text-xs text-gray-500">
              Square format recommended (1:1 ratio). Max 5MB. JPEG, PNG, or WebP.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image Upload */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Cover Image</span>
              {isRequired && <span className="text-red-500">*</span>}
            </CardTitle>
            {images.cover && <Badge variant="outline" className="text-green-600">✓ Uploaded</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {images.cover ? (
              <div className="relative">
                <img
                  src={images.cover}
                  alt="Cover Image"
                  className="w-full h-48 object-cover rounded-lg border cursor-pointer"
                  onClick={() => setPreviewImage(images.cover!)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => document.getElementById('cover-input')?.click()}
                >
                  Change Cover
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload a cover image for your business</p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('cover-input')?.click()}
                  disabled={uploading}
                >
                  Select Cover Image
                </Button>
              </div>
            )}
            
            <input
              id="cover-input"
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, 'cover');
              }}
            />
            
            {uploadProgress.cover !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.cover}%` }}
                />
              </div>
            )}
            
            {errors.cover && (
              <p className="text-sm text-red-600">{errors.cover}</p>
            )}
            
            <p className="text-xs text-gray-500">
              Wide format recommended (16:9 ratio). Max 5MB. JPEG, PNG, or WebP.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Upload */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Business Gallery</span>
              {isRequired && <span className="text-red-500">*</span>}
            </CardTitle>
            <Badge variant="outline" className={images.gallery.length >= MIN_GALLERY_IMAGES ? "text-green-600" : "text-yellow-600"}>
              {images.gallery.length}/{MIN_GALLERY_IMAGES} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gallery Grid */}
            {images.gallery.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.gallery.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                      onClick={() => setPreviewImage(image)}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeGalleryImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add More Images */}
            {images.gallery.length < MAX_GALLERY_IMAGES && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Add business photos ({images.gallery.length}/{MAX_GALLERY_IMAGES})
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Minimum {MIN_GALLERY_IMAGES} images required for verification
                </p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('gallery-input')?.click()}
                  disabled={uploading}
                >
                  Add Photos
                </Button>
              </div>
            )}
            
            <input
              id="gallery-input"
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(file => handleFileSelect(file, 'gallery'));
              }}
            />
            
            {uploadProgress.gallery !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.gallery}%` }}
                />
              </div>
            )}
            
            {errors.gallery && (
              <p className="text-sm text-red-600">{errors.gallery}</p>
            )}
            
            <p className="text-xs text-gray-500">
              Add photos of your business interior, exterior, products, or services. Max 5MB per image.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessImageManager;