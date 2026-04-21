import axios from "axios";

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "")

const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL)
const resolvedBaseUrl = envBaseUrl || "http://localhost:5000"
const apiBaseUrl = resolvedBaseUrl.endsWith("/api")
  ? resolvedBaseUrl
  : `${resolvedBaseUrl}/api`

const API = axios.create({
  baseURL: apiBaseUrl
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config;
})

export default API;