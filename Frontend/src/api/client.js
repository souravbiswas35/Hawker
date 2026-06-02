import axios from "axios";

function normalizeApiBaseUrl(url) {
  const raw = (url || "http://localhost:8080/api").replace(/\/+$/, "");
  // Accept both forms: http://host:port and http://host:port/api
  if (/\/api$/i.test(raw)) return raw;
  return `${raw}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hawker_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor: handle auth failures and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // If unauthorized or token invalid, clear token and redirect to login
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem("hawker_token");
        localStorage.removeItem("hawker_user");
      } catch (e) {
        // ignore
      }
      // If we're already on the login page, do not force navigation.
      if (!window.location.pathname.startsWith("/login")) {
        // Preserve optional return path
        const returnTo = window.location.pathname + window.location.search;
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
      }
    }

    // Attach server message, if any, for downstream handlers
    return Promise.reject(error);
  },
);

export default api;
