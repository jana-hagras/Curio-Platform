import api from './api';

export const paymentService = {
  create: (data) => api.post('/payments/', data),
  getById: (id) => api.get(`/payments/?id=${id}`),
  getByBuyer: (buyerId) => api.get(`/payments/buyer?buyer_id=${buyerId}`),
  getByOrder: (orderId) => api.get(`/payments/order?order_id=${orderId}`),
  getByRequest: (requestId) => api.get(`/payments/request?request_id=${requestId}`),
  update: (id, data) => api.put(`/payments/?id=${id}`, data),
  delete: (id) => api.delete(`/payments/?id=${id}`),
  search: (value) => api.get(`/payments/search?value=${encodeURIComponent(value)}`),
};
