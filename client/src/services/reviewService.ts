import api from './api';

export interface Review {
  _id: string;
  business: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
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
    const response = await api.get('/reviews', { params });
    return response.data;
  },

  // Get reviews for a specific business
  async getBusinessReviews(businessId: string, params: Omit<ReviewSearchParams, 'businessId'> = {}): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
    averageRating: number;
  }> {
    const response = await api.get('/reviews', { 
      params: { ...params, businessId } 
    });
    return response.data;
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

    const response = await api.post('/reviews', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.review;
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
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data.review;
  },

  // Remove helpful mark
  async removeHelpful(reviewId: string): Promise<Review> {
    const response = await api.delete(`/reviews/${reviewId}/helpful`);
    return response.data.review;
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
  }
};

export default reviewService;
