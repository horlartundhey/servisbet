import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'business';
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'business' | 'admin';
  avatar?: string;
  isEmailVerified: boolean;
  createdAt?: string;
  phone?: string;
  location?: string;
  bio?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  requiresEmailVerification: boolean;
}

export const authService = {
  // User login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Sending login data:', credentials); // Debug log
      const response = await api.post('/auth/login', credentials);
      console.log('Login response:', response.data); // Debug log
      
      const { data } = response.data; // Backend returns { success, data: { token, user info }, message }
      const { token, ...userData } = data;
      
      // Create user object from the response data
      const user = {
        _id: userData._id,
        firstName: userData.firstName || userData.name?.split(' ')[0] || '',
        lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        isEmailVerified: userData.isVerified || userData.isEmailVerified || false
      };
      
      console.log('Processed user data:', user); // Debug log
      
      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, token, user };
    } catch (error) {
      console.error('Login error:', error); // Debug log
      throw error;
    }
  },

  // User registration
  async register(userData: RegisterData): Promise<RegistrationResponse> {
    try {
      console.log('Sending registration data:', userData); // Debug log
      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', response.data); // Debug log
      
      const { message, requiresEmailVerification } = response.data;
      
      return { 
        success: true, 
        message, 
        requiresEmailVerification 
      };
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      throw error;
    }
  },

  // Logout user
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  },

  // Check if user has specific role
  hasRole(role: 'user' | 'business' | 'admin'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Check email availability
  async checkEmailAvailability(email: string): Promise<{ available: boolean; message: string }> {
    try {
      const response = await api.post('/auth/check-email', { email });
      return {
        available: response.data.available,
        message: response.data.message
      };
    } catch (error) {
      console.error('Email check error:', error);
      throw error;
    }
  },

  // Resend verification email (for authenticated users)
  async resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/auth/resend-verification');
      return {
        success: true,
        message: response.data.message || 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  // Resend verification email (public - for unverified users)
  async resendVerificationEmailPublic(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/auth/resend-verification-public', { email });
      return {
        success: true,
        message: response.data.message || 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  // Verify email
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Update profile
  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await api.put('/users/profile', profileData);
    const updatedUser = response.data.user;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  }
};

export default authService;
