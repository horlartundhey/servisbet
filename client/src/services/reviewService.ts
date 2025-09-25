import api from './api';

export interface Review {
  _id: string;
  business: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  // Anonymous review fields
  reviewerName?: string;
  reviewerEmail?: string;
  isAnonymous?: boolean;
  rating: number;
  title: string;
  content: string;
  photos: string[];
  response?: {
    content: string;
    respondedAt: string;
    respondedBy: string;
  };
  isVerified: boolean;
  helpfulVotes: number;
  flaggedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  businessId: string;
  rating: number;
  title: string;
  content: string;
  photos?: File[];
}

export interface AnonymousReviewData {
  business: string;
  rating: number;
  title?: string;
  content: string;
  reviewerName: string;
  reviewerEmail: string;
  images?: string[];
}

export interface EmailVerificationData {
  reviewId: string;
}

export interface ResendEmailData {
  reviewId: string;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  content?: string;
  photos?: File[];
}

export interface ReviewResponse {
  content: string;
}

export interface ReviewSearchParams {
  businessId?: string;
  userId?: string;
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
}

export const reviewService = {
  // Get reviews with filters
  async getReviews(params: ReviewSearchParams = {}): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
    averageRating: number;
  }> {
    const response = await api.get('/review', { params });
    return {
      reviews: response.data.data || [],
      total: response.data.pagination?.totalReviews || 0,
      page: response.data.pagination?.currentPage || 1,
      totalPages: response.data.pagination?.totalPages || 1,
      averageRating: response.data.averageRating || 0
    };
  },

  // Get reviews for a specific business
  async getBusinessReviews(businessId: string, params: Omit<ReviewSearchParams, 'businessId'> = {}): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
    averageRating: number;
  }> {
    const response = await api.get(`/review/business/${businessId}`, { 
      params 
    });
    // Transform API response to match expected format
    return {
      reviews: response.data.data || [],
      total: response.data.count || 0,
      page: parseInt(response.data.pagination?.currentPage) || 1,
      totalPages: response.data.pagination?.totalPages || 1,
      averageRating: response.data.averageRating || 0
    };
  },

  // Get single review by ID
  async getReviewById(id: string): Promise<Review> {
    const response = await api.get(`/reviews/${id}`);
    return response.data.review;
  },

  // Create new review (requires user authentication)
  async createReview(reviewData: CreateReviewData): Promise<Review> {
    const formData = new FormData();
    formData.append('businessId', reviewData.businessId);
    formData.append('rating', reviewData.rating.toString());
    formData.append('title', reviewData.title);
    formData.append('content', reviewData.content);

    if (reviewData.photos && reviewData.photos.length > 0) {
      reviewData.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }

    const response = await api.post('/review', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.review;
  },

  // Create anonymous review (no authentication required)
  async createAnonymousReview(formData: FormData): Promise<any> {
    const response = await api.post('/review/anonymous', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Verify anonymous review email (via link)
  async verifyAnonymousEmail(token: string): Promise<any> {
    const response = await api.get(`/review/verify/${token}`);
    return response.data;
  },

  // Resend email verification
  async resendEmailVerification(data: ResendEmailData): Promise<any> {
    const response = await api.post('/review/resend-email-verification', data);
    return response.data;
  },

  // Update review (requires review ownership)
  async updateReview(id: string, updates: UpdateReviewData): Promise<Review> {
    const formData = new FormData();
    
    if (updates.rating !== undefined) {
      formData.append('rating', updates.rating.toString());
    }
    if (updates.title) {
      formData.append('title', updates.title);
    }
    if (updates.content) {
      formData.append('content', updates.content);
    }
    if (updates.photos && updates.photos.length > 0) {
      updates.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }

    const response = await api.put(`/reviews/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.review;
  },

  // Delete review (requires review ownership)
  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  // Respond to review (requires business ownership)
  async respondToReview(reviewId: string, responseData: ReviewResponse): Promise<Review> {
    const response = await api.post(`/reviews/${reviewId}/response`, responseData);
    return response.data.review;
  },

  // Update review response (requires business ownership)
  async updateReviewResponse(reviewId: string, responseData: ReviewResponse): Promise<Review> {
    const response = await api.put(`/reviews/${reviewId}/response`, responseData);
    return response.data.review;
  },

  // Delete review response (requires business ownership)
  async deleteReviewResponse(reviewId: string): Promise<Review> {
    const response = await api.delete(`/reviews/${reviewId}/response`);
    return response.data.review;
  },

  // Mark review as helpful
  async markHelpful(reviewId: string): Promise<Review> {
    const response = await api.post(`/review/${reviewId}/helpful`);
    return response.data.data;
  },

  // Remove helpful mark
  async removeHelpful(reviewId: string): Promise<Review> {
    const response = await api.delete(`/review/${reviewId}/helpful`);
    return response.data.data;
  },

  // Flag review as inappropriate
  async flagReview(reviewId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/reviews/${reviewId}/flag`, { reason });
    return response.data;
  },

  // Get user's reviews
  async getMyReviews(params: Omit<ReviewSearchParams, 'userId'> = {}): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await api.get('/reviews/my-reviews', { params });
    return response.data;
  },

  // Get review statistics for a business
  async getReviewStats(businessId: string): Promise<{
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
  }> {
    const response = await api.get(`/reviews/stats/${businessId}`);
    return response.data;
  },

  // Get user reviews (for profile page)
  async getUserReviews(userId?: string): Promise<{
    reviews: Review[];
    total: number;
  }> {
    try {
      const endpoint = userId ? `/review/user/${userId}` : '/review/my-reviews';
      const response = await api.get(endpoint);
      return {
        reviews: response.data.data || [],
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }
};

export default reviewService;
