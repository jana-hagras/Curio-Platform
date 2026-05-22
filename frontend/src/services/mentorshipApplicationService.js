import api from './api';

export const mentorshipApplicationService = {
  getAll: () => api.get('/mentorship-applications/all'),
  search: (value) => api.get(`/mentorship-applications/search?value=${encodeURIComponent(value)}`),
  getByMentorship: (mentorshipId) => api.get(`/mentorship-applications/mentorship?mentorship_id=${mentorshipId}`),
  getByBuyer: (buyerId) => api.get(`/mentorship-applications/buyer?buyer_id=${buyerId}`),
  getByArtisan: (artisanId) => api.get(`/mentorship-applications/artisan?artisan_id=${artisanId}`),
  getById: (id) => api.get(`/mentorship-applications/?id=${id}`),
  create: (data) => api.post('/mentorship-applications/', data),
  update: (id, data) => api.put(`/mentorship-applications/?id=${id}`, data),
  delete: (id) => api.delete(`/mentorship-applications/?id=${id}`),
};
