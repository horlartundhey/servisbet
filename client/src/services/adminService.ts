import api from './api';

export interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalReviews: number;
  pendingVerifications: number;
  flaggedContent: number;
  activeDisputes: number;
  pendingDisputes: number;
}

export interface AdminDashboardData {
  overview: AdminStats;
  usersByRole: Record<string, number>;
  businessesByCategory: Record<string, number>;
  businessesByVerificationStatus: Record<string, number>;
  reviewsByRating: Record<string, number>;
  recentActivity: {
    recentUsers: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    recentBusinesses: Array<{
      _id: string;
      businessName: string;
      businessCategory: string;
      verificationStatus: string;
      owner: {
        firstName: string;
        lastName: string;
        email: string;
      };
      createdAt: string;
    }>;
    flaggedReviews: Array<{
      _id: string;
      rating: number;
      comment: string;
      user: {
        firstName: string;
        lastName: string;
      };
      business: {
        businessName: string;
      };
      createdAt: string;
    }>;
  };
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface BusinessProfile {
  _id: string;
  businessName: string;
  businessCategory: string;
  verificationStatus: string;
  isActive: boolean;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface FlaggedReview {
  _id: string;
  rating: number;
  comment: string;
  status: string;
  user: {
    firstName: string;
    lastName: string;
  };
  business: {
    businessName: string;
  };
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  data: T[];
}

class AdminService {
  // Get dashboard stats
  async getDashboardStats(): Promise<AdminDashboardData> {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  }

  // User management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get('/admin/users', { params });
    return response.data;
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data.data;
  }

  // Business management
  async getBusinesses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<BusinessProfile>> {
    const response = await api.get('/admin/businesses', { params });
    return response.data;
  }

  async updateBusinessStatus(
    businessId: string, 
    data: { status?: string; verificationStatus?: string }
  ): Promise<BusinessProfile> {
    const response = await api.put(`/admin/businesses/${businessId}/status`, data);
    return response.data.data;
  }

  // Review management
  async getFlaggedReviews(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<FlaggedReview>> {
    const response = await api.get('/admin/reviews/flagged', { params });
    return response.data;
  }

  async moderateReview(
    reviewId: string, 
    data: { action: 'approve' | 'remove'; reason?: string }
  ): Promise<any> {
    const response = await api.put(`/admin/reviews/${reviewId}/moderate`, data);
    return response.data;
  }

  // Analytics
  async getAnalytics(period: string = '30'): Promise<any> {
    const response = await api.get('/admin/analytics', { params: { period } });
    return response.data.data;
  }
}

export const adminService = new AdminService();