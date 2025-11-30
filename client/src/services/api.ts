import axios from 'axios';

// API Configuration with production fallback
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 
  (import.meta.env.PROD 
    ? 'https://servisbeta-server.vercel.app/api' 
    : 'http://localhost:5000/api');

// Enhanced logging for debugging (especially iOS issues)
console.log('=== Servisbeta API Configuration ===');
console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', import.meta.env.MODE);
console.log('Is Production:', import.meta.env.PROD);
console.log('Client URL:', window.location.origin);
console.log('User Agent:', navigator.userAgent);
console.log('Platform:', navigator.platform);

if (import.meta.env.DEV) {
  console.log('Full environment variables:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    MODE: import.meta.env.MODE,
  });
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for serverless functions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration with retry mechanism
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth';
      return Promise.reject(error);
    }
    
    // Enhanced error handling for different scenarios
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      console.error(`API Error ${statusCode}:`, {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        data: errorData,
        status: statusCode
      });
      
      // Create user-friendly error messages based on status codes
      let userMessage = 'An unexpected error occurred. Please try again.';
      
      switch (statusCode) {
        case 400:
          userMessage = errorData?.message || 'Invalid request. Please check your input.';
          break;
        case 403:
          userMessage = errorData?.message || 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = 'The requested resource was not found.';
          break;
        case 409:
          userMessage = errorData?.message || 'This action conflicts with existing data.';
          break;
        case 429:
          userMessage = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          userMessage = 'Server error. Please try again in a few moments.';
          break;
        default:
          userMessage = errorData?.message || userMessage;
      }
      
      // Create enhanced error object
      const enhancedError = new Error(userMessage) as any;
      enhancedError.response = error.response;
      enhancedError.status = statusCode;
      enhancedError.data = errorData;
      
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error details:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
      
      let networkMessage = 'Network error. Please check your internet connection and try again.';
      
      if (error.code === 'ECONNABORTED') {
        networkMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        networkMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      return Promise.reject(new Error(networkMessage));
    } else {
      // Something else happened in setting up the request
      console.error('Request setup error:', error.message);
      return Promise.reject(new Error('Failed to send request. Please try again.'));
    }
  }
);

export default api;
