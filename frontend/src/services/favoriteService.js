import api from './api';

export const favoriteService = {
  getByUser: (userId) => api.get(`/favorites/user?user_id=${userId}`),
  add: (data) => api.post('/favorites/', data),
  remove: (id) => api.delete(`/favorites/?id=${id}`),
  check: (userId, itemId) => api.get(`/favorites/check?user_id=${userId}&item_id=${itemId}`),
};
