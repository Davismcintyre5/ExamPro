import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const code = error.response.data?.code;

      if (code === 'TOKEN_INVALID' || code === 'AUTH_FAILED') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('tempAdminToken');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    if (error.response && error.response.status === 403) {
      const code = error.response.data?.code;
      if (code === 'MUST_CHANGE_PASSWORD') {
        if (window.location.pathname !== '/change-password') {
          window.location.href = '/change-password';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;