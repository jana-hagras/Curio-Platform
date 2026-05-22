import api from './api';

export const workshopService = {
  getAll: () => api.get('/workshops/all'),
  search: (value) => api.get(`/workshops/search?value=${encodeURIComponent(value)}`),
  getById: (id) => api.get(`/workshops/?id=${id}`),
  getByArtisan: (artisanId) => api.get(`/workshops/artisan?artisan_id=${artisanId}`),
  create: (data) => api.post('/workshops/', data),
  update: (id, data) => api.put(`/workshops/?id=${id}`, data),
  delete: (id) => api.delete(`/workshops/?id=${id}`),
};
