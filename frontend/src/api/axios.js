// frontend/src/api/axios.js
import axios from 'axios';

// Prefer Vite env var; fall back to a sensible default.
const fallback =
  typeof window !== 'undefined'
    ? `${window.location.origin.replace(/\/$/, '')}/api/`
    : 'http://127.0.0.1:8000/api/';

const baseURL =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) 
    ? import.meta.env.VITE_API_BASE_URL 
    : fallback;

// Optional: quick sanity log (remove later).
// console.log('API base:', baseURL);

const api = axios.create({
  baseURL, // e.g. https://taxonomy-website.onrender.com/api/
  // withCredentials: true, // enable if you ever use cookie auth/CSRF
});

// Interceptor para loguear cada request
api.interceptors.request.use(cfg => {
  console.log('REQ →', cfg.baseURL, cfg.url);
  return cfg;
});

export default api;
