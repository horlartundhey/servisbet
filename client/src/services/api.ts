import axios from 'axios';

// API Configuration with production fallback
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 
  (import.meta.env.PROD 
    ? 'https://servisbeta-server.vercel.app/api' 
    : 'http://localhost:5000/api');

// Enhanced logging for debugging (especially iOS issues)
console.log('=== ServisbetA API Configuration ===');
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
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

export default api;
