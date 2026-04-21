import api from './api';

export const portfolioService = {
  create: (data) => api.post('/portfolio/', data),
  getAll: () => api.get('/portfolio/all'),
  getById: (id) => api.get(`/portfolio/?id=${id}`),
  update: (id, data) => api.put(`/portfolio/?id=${id}`, data),
  delete: (id) => api.delete(`/portfolio/?id=${id}`),
  search: (value) => api.get(`/portfolio/search?value=${encodeURIComponent(value)}`),
};
