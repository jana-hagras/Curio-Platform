import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('curio_user') || 'null');
    if (user?.id) {
      config.headers['X-User-Id'] = user.id;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const errors = error.response?.data?.errors || [];
    return Promise.reject({ message, errors, status: error.response?.status });
  }
);

export default api;
