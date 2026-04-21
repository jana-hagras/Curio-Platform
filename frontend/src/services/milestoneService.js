import api from './api';

export const milestoneService = {
  create: (data) => api.post('/milestones/', data),
  getByRequest: (requestId) => api.get(`/milestones/request?request_id=${requestId}`),
  getById: (id) => api.get(`/milestones/?id=${id}`),
  update: (id, data) => api.put(`/milestones/?id=${id}`, data),
  delete: (id) => api.delete(`/milestones/?id=${id}`),
  search: (value) => api.get(`/milestones/search?value=${encodeURIComponent(value)}`),
};
