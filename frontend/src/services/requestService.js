import api from './api';

export const requestService = {
  create: (data) => api.post('/requests/', data),
  getAll: () => api.get('/requests/all'),
  getById: (id) => api.get(`/requests/?id=${id}`),
  getByIdAdmin: (id) => api.get(`/requests/admin?id=${id}`),
  getByBuyer: (buyerId) => api.get(`/requests/buyer?buyer_id=${buyerId}`),
  update: (id, data) => api.put(`/requests/?id=${id}`, data),
  delete: (id) => api.delete(`/requests/?id=${id}`),
  search: (value) => api.get(`/requests/search?value=${encodeURIComponent(value)}`),
  getGenerations: (requestId) => api.get(`/requests/generations?request_id=${requestId}`),
  regenerate: (id) => api.post(`/requests/regenerate?id=${id}`),
  // AI Refinement & Versioning
  refine: (id, refinementPrompt) => api.post(`/requests/refine?id=${id}`, { refinementPrompt }),
  getVersions: (requestId) => api.get(`/requests/versions?request_id=${requestId}`),
  setPreferred: (generationId) => api.put(`/requests/prefer-version?generation_id=${generationId}`),
};
