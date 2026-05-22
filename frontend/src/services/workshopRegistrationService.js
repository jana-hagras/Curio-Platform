import api from './api';

export const workshopRegistrationService = {
  getAll: () => api.get('/workshop-registrations/all'),
  getByWorkshop: (workshopId) => api.get(`/workshop-registrations/workshop?workshop_id=${workshopId}`),
  getByBuyer: (buyerId) => api.get(`/workshop-registrations/buyer?buyer_id=${buyerId}`),
  getByArtisan: (artisanId) => api.get(`/workshop-registrations/artisan?artisan_id=${artisanId}`),
  create: (data) => api.post('/workshop-registrations/', data),
  update: (id, data) => api.put(`/workshop-registrations/?id=${id}`, data),
  delete: (id) => api.delete(`/workshop-registrations/?id=${id}`),
};
