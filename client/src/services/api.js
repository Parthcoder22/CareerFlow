// ============================================
// Axios API Service Layer
// ============================================
// Centralized HTTP client with automatic JWT token attachment,
// error handling, and base URL configuration.

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: Attach JWT token to every request from this tab's sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('careerflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle auth errors globally for this tab only
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('careerflow_token');
      sessionStorage.removeItem('careerflow_user');
      const publicPaths = ['/login', '/signup', '/forgot-password', '/'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// API Service Functions
// ============================================

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};

// Student Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

// Applications (Student)
export const applicationAPI = {
  getAll: (params) => api.get('/applications', { params }),
  getOne: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
};

// Resumes
export const resumeAPI = {
  getAll: () => api.get('/resumes'),
  upload: (formData) => api.post('/resumes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/resumes/${id}`),
};

// AI & ATS Analyzer
export const aiAPI = {
  analyzeResume: (data) => api.post('/ai/analyze-resume', data),
  analyzeJD: (data) => api.post('/ai/analyze-jd', data),
};

// Experiences
export const experienceAPI = {
  getAll: (params) => api.get('/experiences', { params }),
  create: (data) => api.post('/experiences', data),
  toggleLike: (id) => api.post(`/experiences/${id}/like`),
  toggleBookmark: (id) => api.post(`/experiences/${id}/bookmark`),
  getBookmarks: () => api.get('/experiences/bookmarks'),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Admin / TNP Authority
export const adminAPI = {
  getStatistics: () => api.get('/admin/statistics'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getStudentDetails: (id) => api.get(`/admin/students/${id}`),
  updateStudentPermission: (id, data) => api.put(`/admin/students/${id}/permission`, data),
  getCompanies: (params) => api.get('/admin/companies', { params }),
  addCompany: (data) => api.post('/admin/companies', data),
  updateCompany: (id, data) => api.put(`/admin/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`),
  getCompanyApplicants: (id) => api.get(`/admin/companies/${id}/applicants`),
  getAllApplications: (params) => api.get('/admin/applications', { params }),
  updateApplicationStatus: (id, data) => api.put(`/admin/applications/${id}/status`, data),
};

// Public/Student Campus Drive Companies
export const companyAPI = {
  getAll: () => api.get('/companies'),
};

export default api;
