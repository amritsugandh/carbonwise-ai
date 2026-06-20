import axios from 'axios';
import { auth } from '../firebase/config';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Helper: get a fresh token, force-refresh if needed ───────────────────────
const getFreshToken = async (forceRefresh = false) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return await currentUser.getIdToken(forceRefresh);
  }
  // Fall back to stored token
  return localStorage.getItem('token');
};

// ── Request interceptor — always attach a fresh Firebase token ───────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getFreshToken(false);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Keep localStorage in sync
        localStorage.setItem('token', token);
      }
    } catch (err) {
      console.error('Token fetch error:', err);
      // Try stored token as last resort
      const stored = localStorage.getItem('token');
      if (stored) config.headers.Authorization = `Bearer ${stored}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — auto-retry once with a force-refreshed token ──────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Force refresh the Firebase ID token
        const newToken = await getFreshToken(true);
        if (newToken) {
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest); // Retry with new token
        }
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        localStorage.removeItem('token');
      }
    }

    return Promise.reject(error);
  }
);

// ── API endpoints ─────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: () => api.post('/auth/login'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const carbonAPI = {
  calculate: (data) => api.post('/carbon/calculate', data),
  save: (data) => api.post('/carbon/save', data),
  getHistory: (params) => api.get('/carbon/history', { params }),
  getStats: () => api.get('/carbon/stats'),
};

export const goalsAPI = {
  create: (data) => api.post('/goals', data),
  getAll: () => api.get('/goals'),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const challengesAPI = {
  getAll: () => api.get('/challenges'),
  complete: (challengeId) => api.post('/challenges/complete', { challengeId }),
};

export const aiAPI = {
  getRecommendations: (data) => api.post('/ai/recommendations', data),
  chat: (data) => api.post('/ai/chat', data),
};

export const predictionsAPI = {
  generate: () => api.post('/predictions/generate'),
  getLatest: () => api.get('/predictions/latest'),
  getHistory: () => api.get('/predictions/history'),
};

export const reportsAPI = {
  generate: () => api.post('/reports/generate'),
  getAll: () => api.get('/reports'),
  download: (id) => api.get(`/reports/download/${id}`),
};

export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
};

export default api;
