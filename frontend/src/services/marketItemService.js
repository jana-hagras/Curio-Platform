import api from './api';

export const marketItemService = {
  create: (data) => api.post('/market-items/', data),
  getAll: () => api.get('/market-items/all'),
  getById: (id) => api.get(`/market-items/?id=${id}`),
  getByArtisan: (artisanId) => api.get(`/market-items/artisan?artisan_id=${artisanId}`),
  update: (id, data) => api.put(`/market-items/?id=${id}`, data),
  delete: (id) => api.delete(`/market-items/?id=${id}`),
  search: (value) => api.get(`/market-items/search?value=${encodeURIComponent(value)}`),
};
