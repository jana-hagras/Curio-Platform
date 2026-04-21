import api from './api';

export const requestService = {
  create: (data) => api.post('/requests/', data),
  getAll: () => api.get('/requests/all'),
  getById: (id) => api.get(`/requests/?id=${id}`),
  getByBuyer: (buyerId) => api.get(`/requests/buyer?buyer_id=${buyerId}`),
  update: (id, data) => api.put(`/requests/?id=${id}`, data),
  delete: (id) => api.delete(`/requests/?id=${id}`),
  search: (value) => api.get(`/requests/search?value=${encodeURIComponent(value)}`),
};
