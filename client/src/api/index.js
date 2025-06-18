import axios from 'axios';

// Create axios instance with custom config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://intermediate-twisty-cupcake.glitch.me',
  withCredentials: true, // This is required for cookies to be sent
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include credentials
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Only redirect if we're not already on the login page and not checking auth
      if (!window.location.pathname.includes('/login') && !error.config.url.includes('/auth/check')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 