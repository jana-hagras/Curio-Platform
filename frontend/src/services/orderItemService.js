import api from './api';

export const orderItemService = {
  create: (data) => api.post('/order-items/', data),
  getByOrder: (orderId) => api.get(`/order-items/?order_id=${orderId}`),
  update: (id, data) => api.put(`/order-items/?id=${id}`, data),
  delete: (id) => api.delete(`/order-items/?id=${id}`),
  search: (value) => api.get(`/order-items/search?value=${encodeURIComponent(value)}`),
};
