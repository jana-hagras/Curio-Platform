import api from './api';

export const galleryService = {
  create: (data) => api.post('/gallery/', data),
  getAll: () => api.get('/gallery/all'),
  getByProject: (projectId) => api.get(`/gallery/?id=${projectId}`),
  update: (id, data) => api.put(`/gallery/?id=${id}`, data),
  delete: (id) => api.delete(`/gallery/?id=${id}`),
  search: (value) => api.get(`/gallery/search?value=${encodeURIComponent(value)}`),
};
