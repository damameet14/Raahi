/**
 * Centralized Axios client for the employee application.
 *
 * Attaches the employee JWT to every request and transparently refreshes it
 * on a 401. Employee tokens use their own localStorage keys so the employee
 * app and the administration portal never share a session.
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY = "raahi_employee_access_token";
export const EMPLOYEE_REFRESH_TOKEN_STORAGE_KEY = "raahi_employee_refresh_token";
export const EMPLOYEE_SESSION_STORAGE_KEY = "raahi_employee_session";

export const employeeApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

employeeApiClient.interceptors.request.use((requestConfiguration) => {
  const storedAccessToken = localStorage.getItem(
    EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY,
  );
  if (storedAccessToken && requestConfiguration.headers) {
    requestConfiguration.headers.Authorization = `Bearer ${storedAccessToken}`;
  }
  return requestConfiguration;
});

employeeApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshableFailure =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._isRetryAttempt &&
      !originalRequest.url?.includes("/authentication/login") &&
      !originalRequest.url?.includes("/authentication/refresh");

    if (!isRefreshableFailure) {
      return Promise.reject(error);
    }

    originalRequest._isRetryAttempt = true;
    const storedRefreshToken = localStorage.getItem(
      EMPLOYEE_REFRESH_TOKEN_STORAGE_KEY,
    );
    if (!storedRefreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/api/v1/authentication/refresh`,
        { refresh_token: storedRefreshToken },
      );
      const { access_token, refresh_token } = refreshResponse.data;
      localStorage.setItem(EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY, access_token);
      localStorage.setItem(EMPLOYEE_REFRESH_TOKEN_STORAGE_KEY, refresh_token);
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return employeeApiClient(originalRequest);
    } catch (refreshError) {
      clearEmployeeSession();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);

export function clearEmployeeSession(): void {
  localStorage.removeItem(EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(EMPLOYEE_REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(EMPLOYEE_SESSION_STORAGE_KEY);
}

function redirectToLogin(): void {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}
