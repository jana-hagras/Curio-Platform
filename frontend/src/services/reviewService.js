import api from './api';

export const reviewService = {
  create: (data) => api.post('/reviews/', data),
  getById: (id) => api.get(`/reviews/?id=${id}`),
  getByItem: (itemId) => api.get(`/reviews/item?item_id=${itemId}`),
  getByBuyer: (buyerId) => api.get(`/reviews/buyer?buyer_id=${buyerId}`),
  update: (id, data) => api.put(`/reviews/?id=${id}`, data),
  delete: (id) => api.delete(`/reviews/?id=${id}`),
  search: (value) => api.get(`/reviews/search?value=${encodeURIComponent(value)}`),
};
