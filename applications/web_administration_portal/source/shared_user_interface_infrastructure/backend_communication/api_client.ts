/**
 * Centralized Axios HTTP client for backend communication.
 *
 * Attaches JWT access token to all requests and handles
 * automatic token refresh on 401 responses.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach access token ────────────
apiClient.interceptors.request.use(
  (requestConfiguration) => {
    const storedAccessToken = localStorage.getItem('raahi_access_token');
    if (storedAccessToken && requestConfiguration.headers) {
      requestConfiguration.headers.Authorization = `Bearer ${storedAccessToken}`;
    }
    return requestConfiguration;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 with refresh ───────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._isRetryAttempt &&
      !originalRequest.url?.includes('/authentication/login') &&
      !originalRequest.url?.includes('/authentication/refresh')
    ) {
      originalRequest._isRetryAttempt = true;
      const storedRefreshToken = localStorage.getItem('raahi_refresh_token');

      if (storedRefreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/v1/authentication/refresh`,
            { refresh_token: storedRefreshToken }
          );

          const { access_token, refresh_token } = refreshResponse.data;
          localStorage.setItem('raahi_access_token', access_token);
          localStorage.setItem('raahi_refresh_token', refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch {
          localStorage.removeItem('raahi_access_token');
          localStorage.removeItem('raahi_refresh_token');
          localStorage.removeItem('raahi_user');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
