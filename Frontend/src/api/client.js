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

export default api;
