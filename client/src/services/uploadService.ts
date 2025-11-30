import api from './api';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  };
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data: Array<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }>;
}

const uploadService = {
  // Upload single image
  async uploadSingle(file: File, folder: string = 'servisbeta/general'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload multiple images
  async uploadMultiple(files: File[], folder: string = 'servisbeta/general'): Promise<MultipleUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('folder', folder);

    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete image
  async deleteImage(publicId: string): Promise<{ success: boolean; message: string }> {
    // Replace slashes with underscores for URL encoding
    const encodedPublicId = publicId.replace(/\//g, '_');
    const response = await api.delete(`/upload/${encodedPublicId}`);
    return response.data;
  },
};

export default uploadService;
