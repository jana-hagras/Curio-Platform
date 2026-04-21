import api from './api';

export const applicationService = {
  create: (data) => api.post('/applications/', data),
  getByRequest: (requestId) => api.get(`/applications/request?request_id=${requestId}`),
  getByArtisan: (artisanId) => api.get(`/applications/artisan?artisan_id=${artisanId}`),
  getById: (id) => api.get(`/applications/?id=${id}`),
  update: (id, data) => api.put(`/applications/?id=${id}`, data),
  delete: (id) => api.delete(`/applications/?id=${id}`),
  search: (value) => api.get(`/applications/search?value=${encodeURIComponent(value)}`),
};
