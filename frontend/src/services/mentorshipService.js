import api from './api';

export const mentorshipService = {
  getAll: () => api.get('/mentorships/all'),
  search: (value) => api.get(`/mentorships/search?value=${encodeURIComponent(value)}`),
  getById: (id) => api.get(`/mentorships/?id=${id}`),
  getByArtisan: (artisanId) => api.get(`/mentorships/artisan?artisan_id=${artisanId}`),
  create: (data) => api.post('/mentorships/', data),
  update: (id, data) => api.put(`/mentorships/?id=${id}`, data),
  delete: (id) => api.delete(`/mentorships/?id=${id}`),
};
