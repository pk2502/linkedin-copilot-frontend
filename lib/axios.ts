import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  API_BASE,
  SessionExpiredError,
  clearTokens,
  getAccessToken,
  handleSessionExpired,
  refreshAccessToken,
  setTokens,
} from "@/lib/tokens";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Endpoints whose 401 means "bad credentials", not "expired access token".
const AUTH_ENDPOINTS = ["/api/auth/login/", "/api/auth/register/", "/api/auth/refresh/", "/api/auth/social/"];

const isAuthEndpoint = (url?: string) => !!url && AUTH_ENDPOINTS.some((path) => url.includes(path));

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const access = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      if (refreshError instanceof SessionExpiredError) handleSessionExpired();
      return Promise.reject(error);
    }
  }
);

export { setTokens, clearTokens };
export default api;
