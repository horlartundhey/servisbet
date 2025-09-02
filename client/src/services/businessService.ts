import api from './api';

export interface Business {
  _id: string;
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
  owner: string;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
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
    const response = await api.get('/businesses', { params });
    return response.data;
  },

  // Get single business by ID
  async getBusinessById(id: string): Promise<Business> {
    const response = await api.get(`/businesses/${id}`);
    return response.data.business;
  },

  // Create new business (requires business account)
  async createBusiness(businessData: CreateBusinessData): Promise<Business> {
    const response = await api.post('/businesses', businessData);
    return response.data.business;
  },

  // Update business (requires business ownership)
  async updateBusiness(id: string, updates: Partial<CreateBusinessData>): Promise<Business> {
    const response = await api.put(`/businesses/${id}`, updates);
    return response.data.business;
  },

  // Delete business (requires business ownership)
  async deleteBusiness(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/businesses/${id}`);
    return response.data;
  },

  // Get business dashboard stats (requires business ownership)
  async getBusinessStats(id: string): Promise<BusinessStats> {
    const response = await api.get(`/businesses/${id}/stats`);
    return response.data;
  },

  // Upload business images
  async uploadBusinessImages(id: string, images: File[]): Promise<{ images: string[] }> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });

    const response = await api.post(`/businesses/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get business categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/businesses/categories');
    return response.data.categories;
  },

  // Search businesses by location
  async searchNearby(latitude: number, longitude: number, radius: number = 10): Promise<Business[]> {
    const response = await api.get('/businesses/nearby', {
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

    const response = await api.post(`/businesses/${id}/claim`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user's businesses (for business owners)
  async getMyBusinesses(): Promise<Business[]> {
    const response = await api.get('/businesses/my-businesses');
    return response.data.businesses;
  },

  // Update business hours
  async updateBusinessHours(id: string, hours: Business['hours']): Promise<Business> {
    const response = await api.put(`/businesses/${id}/hours`, { hours });
    return response.data.business;
  }
};

export default businessService;
