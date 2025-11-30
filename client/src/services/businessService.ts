// ...existing code...
// ...existing code...
import api from './api';

export interface Business {
  _id: string;
  slug?: string;
  name: string;
  description: string;
  category: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  phone: string;
  email: string;
  website?: string;
  hours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  images: string[];
  logo?: string; // Business logo URL
  cover?: string; // Business cover image URL
  owner: string;
  averageRating: number;
  totalReviews: number;
  isVerified?: boolean;
  isActive: boolean;
  verificationStatus?: 'incomplete' | 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: string;
  businessHours?: any;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessData {
  name: string;
  description: string;
  category: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: [number, number]; // [longitude, latitude]
  phone: string;
  email: string;
  website?: string;
  hours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
}

export interface BusinessSearchParams {
  query?: string;
  category?: string;
  city?: string;
  state?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'reviews' | 'distance' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface BusinessStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recentReviews: number; // last 30 days
  responseRate: number;
  averageResponseTime: number; // in hours
}

export const businessService = {
  // Get all businesses with search and filters
  async getBusinesses(params: BusinessSearchParams = {}): Promise<{
    businesses: Business[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await api.get('/business', { params });
    // Transform API response to match expected format
    return {
      businesses: response.data.businesses || [],
      total: response.data.total || 0,
      page: parseInt(response.data.pagination?.currentPage) || 1,
      totalPages: response.data.pagination?.totalPages || 1
    };
  },

  // Get single business by ID
  async getBusinessById(id: string): Promise<Business> {
    console.log('🔍 businessService.getBusinessById called with ID:', id);
    console.log('🌐 Making API call to:', `/business/${id}`);
    
    try {
      const response = await api.get(`/business/${id}`);
      console.log('✅ businessService: Raw API response:', response);
      console.log('📦 businessService: Response data:', response.data);
      console.log('🏢 businessService: Business data:', response.data.data);
      
      return response.data.data;
    } catch (error: any) {
      console.error('❌ businessService.getBusinessById error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Create new business (requires business account)
  async createBusiness(businessData: CreateBusinessData): Promise<Business> {
    const response = await api.post('/business', businessData);
    return response.data.business;
  },

  // Update business (requires business ownership)
  async updateBusiness(id: string, updates: Partial<CreateBusinessData>): Promise<Business> {
    const response = await api.put(`/business/${id}`, updates);
    return response.data.business;
  },

  // Delete business (requires business ownership)
  async deleteBusiness(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/business/${id}`);
    return response.data;
  },

  // Get business dashboard stats (requires business ownership)
  async getBusinessStats(id: string): Promise<BusinessStats> {
    const response = await api.get(`/business/${id}/stats`);
    return response.data;
  },


  // Upload business images
  async uploadBusinessImages(id: string, images: File[]): Promise<{ images: string[] }> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });

    const response = await api.post(`/business/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload business verification documents (step 2)
  async uploadVerificationDocuments(businessId: string, registrationDoc: File, ownerId: File, notes?: string): Promise<any> {
    const formData = new FormData();
    formData.append('registrationDoc', registrationDoc);
    formData.append('ownerId', ownerId);
    if (notes) formData.append('notes', notes);
    const response = await api.post(`/business/${businessId}/upload-documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get business categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/business/categories');
    return response.data.categories;
  },

  // Search businesses by location
  async searchNearby(latitude: number, longitude: number, radius: number = 10): Promise<Business[]> {
    const response = await api.get('/business/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data.businesses;
  },

  // Claim business (for business owners)
  async claimBusiness(id: string, claimData: { 
    reason: string; 
    documents?: File[] 
  }): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('reason', claimData.reason);
    
    if (claimData.documents) {
      claimData.documents.forEach((doc) => {
        formData.append('documents', doc);
      });
    }

    const response = await api.post(`/business/${id}/claim`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user's businesses (for business owners)
  async getMyBusinesses(): Promise<{ success: boolean; count: number; data: Business[] }> {
    const response = await api.get('/business/my/businesses');
    return response.data;
  },

  // Get user's primary business
  async getMyPrimaryBusiness(): Promise<{ success: boolean; data: Business }> {
    const response = await api.get('/business/my/primary');
    return response.data;
  },

  // Create additional business for multi-business accounts
  async createAdditionalBusiness(businessData: CreateBusinessData): Promise<Business> {
    const response = await api.post('/business/create-additional', businessData);
    return response.data.business;
  },

  // Set business as primary
  async setPrimaryBusiness(businessId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/business/${businessId}/set-primary`);
    return response.data;
  },


  // Get business by slug
  async getBusinessBySlug(slug: string): Promise<Business> {
    const response = await api.get(`/business/slug/${slug}`);
    return response.data.data;
  },

  // Update business hours
  async updateBusinessHours(id: string, hours: Business['hours']): Promise<Business> {
    const response = await api.put(`/business/${id}/hours`, { hours });
    return response.data.business;
  },

  // Admin: Get all pending business verifications
  async getPendingVerifications(): Promise<any[]> {
    const response = await api.get('/business-verification/pending');
    return response.data.data;
  },

  // Admin: Approve business verification
  async approveVerification(businessId: string, feedback?: string): Promise<any> {
    const response = await api.post(`/business-verification/${businessId}/approve`, { feedback });
    return response.data;
  },

  // Admin: Reject business verification
  async rejectVerification(businessId: string, feedback?: string): Promise<any> {
    const response = await api.post(`/business-verification/${businessId}/reject`, { feedback });
    return response.data;
  }
};

export default businessService;
