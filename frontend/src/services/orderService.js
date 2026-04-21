import api from './api';

export const orderService = {
  create: (data) => api.post('/orders/', data),
  getAll: () => api.get('/orders/all'),
  getById: (id) => api.get(`/orders/?id=${id}`),
  getByBuyer: (buyerId) => api.get(`/orders/buyer?buyer_id=${buyerId}`),
  update: (id, data) => api.put(`/orders/?id=${id}`, data),
  delete: (id) => api.delete(`/orders/?id=${id}`),
  search: (value) => api.get(`/orders/search?value=${encodeURIComponent(value)}`),
};
