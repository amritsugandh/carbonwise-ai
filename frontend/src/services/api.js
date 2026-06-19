import axios from 'axios';
import { auth } from '../firebase/config';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach fresh Firebase token
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        const stored = localStorage.getItem('token');
        if (stored) config.headers.Authorization = `Bearer ${stored}`;
      }
    } catch (err) {
      console.error('Token refresh error:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: () => api.post('/auth/login'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Carbon
export const carbonAPI = {
  calculate: (data) => api.post('/carbon/calculate', data),
  save: (data) => api.post('/carbon/save', data),
  getHistory: (params) => api.get('/carbon/history', { params }),
  getStats: () => api.get('/carbon/stats'),
};

// Goals
export const goalsAPI = {
  create: (data) => api.post('/goals', data),
  getAll: () => api.get('/goals'),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Challenges
export const challengesAPI = {
  getAll: () => api.get('/challenges'),
  complete: (challengeId) => api.post('/challenges/complete', { challengeId }),
};

// AI
export const aiAPI = {
  getRecommendations: (data) => api.post('/ai/recommendations', data),
  chat: (data) => api.post('/ai/chat', data),
};

// Predictions
export const predictionsAPI = {
  generate: () => api.post('/predictions/generate'),
  getLatest: () => api.get('/predictions/latest'),
  getHistory: () => api.get('/predictions/history'),
};

// Reports
export const reportsAPI = {
  generate: () => api.post('/reports/generate'),
  getAll: () => api.get('/reports'),
  download: (id) => api.get(`/reports/download/${id}`),
};

// Leaderboard
export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
};

export default api;
