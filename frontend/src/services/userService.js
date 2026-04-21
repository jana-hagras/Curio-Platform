import api from './api';

export const userService = {
  register: (data) => api.post('/user/register', data),
  login: (data) => api.post('/user/login', data),
  getMe: (id) => api.get(`/user/me/${id}`),
  getAll: () => api.get('/user/all'),
  getById: (id) => api.get(`/user/?id=${id}`),
  update: (id, data) => api.put(`/user/?id=${id}`, data),
  delete: (id) => api.delete(`/user/?id=${id}`),
  search: (value) => api.get(`/user/search?value=${encodeURIComponent(value)}`),
};
