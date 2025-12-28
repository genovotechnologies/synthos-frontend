import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.synthos.dev/api/v1';

// A05:2021 - Security Misconfiguration: Configure secure defaults
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
  withCredentials: false, // Don't send cookies to API by default
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // A09:2021 - Security Logging: Log security-relevant errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('access_token', { path: '/' });
      if (typeof window !== 'undefined') {
        // Prevent open redirect by using relative URL
        window.location.href = '/login';
      }
    }
    
    // A05:2021 - Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please slow down requests.');
    }

    // A09:2021 - Don't expose internal error details to users
    const sanitizedError = new Error(
      error.response?.data?.message || 'An unexpected error occurred'
    );
    return Promise.reject(sanitizedError);
  }
);

export default apiClient;
