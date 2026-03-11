import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Documents
export const documentsApi = {
  getAll: (params) => api.get('/documents', { params }),
  getOne: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  share: (id, data) => api.post(`/documents/${id}/share`, data),
  removeCollaborator: (docId, userId) => api.delete(`/documents/${docId}/collaborators/${userId}`),
};

// Comments
export const commentsApi = {
  getByDocument: (documentId) => api.get(`/comments/${documentId}`),
  create: (data) => api.post('/comments', data),
  addReply: (commentId, data) => api.post(`/comments/${commentId}/replies`, data),
  resolve: (commentId) => api.put(`/comments/${commentId}/resolve`),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};

// Versions
export const versionsApi = {
  getByDocument: (documentId) => api.get(`/versions/${documentId}`),
  restore: (documentId, versionId) => api.post(`/versions/${documentId}/restore/${versionId}`),
};

// Users
export const usersApi = {
  search: (email) => api.get('/users/search', { params: { email } }),
};

export default api;
