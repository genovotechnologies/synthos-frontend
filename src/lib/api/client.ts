import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Default to a same-origin proxy ('/api/v1' -> see src/app/api/v1/[...path]). If
// NEXT_PUBLIC_API_URL is set (e.g. https://api.synthos.dev/api/v1) the browser calls
// the backend directly. Both work; the backend allows cross-origin requests.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false,
});

// Attach the access token to every request.
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

// --- Transparent token refresh (single-flight) -----------------------------------
// The backend issues short-lived (~1h) access tokens plus a long-lived rotating
// refresh token. On a 401 we transparently exchange the refresh token for a new
// access token once and retry the original request, so users are not logged out
// every hour. Only if refresh fails do we clear the session.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get('refresh_token');
  if (!refreshToken) return null;
  try {
    // Bare axios (not apiClient) so this call doesn't recurse through this interceptor.
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const data = res.data as { access_token?: string; refresh_token?: string };
    if (data.access_token) {
      Cookies.set('access_token', data.access_token, { ...COOKIE_OPTIONS, expires: 7 });
      // Backend rotates the refresh token on every use — persist the new one.
      if (data.refresh_token) {
        Cookies.set('refresh_token', data.refresh_token, { ...COOKIE_OPTIONS, expires: 30 });
      }
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

function clearSessionAndRedirect() {
  Cookies.remove('access_token', { path: '/' });
  Cookies.remove('refresh_token', { path: '/' });
  if (typeof window !== 'undefined') {
    const p = window.location.pathname;
    const onAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(
      (r) => p.startsWith(r)
    );
    if (!onAuthPage) {
      window.location.href = '/login';
    }
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{ error?: { code?: string; message?: string }; message?: string }>
  ) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register');

    // One transparent refresh attempt on 401 for non-auth endpoints.
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      clearSessionAndRedirect();
    }

    if (status === 429) {
      console.warn('Rate limit exceeded. Please slow down requests.');
    }

    // The backend returns errors as { error: { code, message } }. Surface that real
    // message (the previous code read data.message, which is always undefined here, so
    // every error showed a generic string). Fall back gracefully.
    const data = error.response?.data;
    const message =
      data?.error?.message || data?.message || error.message || 'An unexpected error occurred';
    const wrapped = new Error(message) as Error & { code?: string; status?: number };
    wrapped.code = data?.error?.code;
    wrapped.status = status;
    return Promise.reject(wrapped);
  }
);

export default apiClient;
