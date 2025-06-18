import axios from 'axios';

// Create axios instance with custom config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://intermediate-twisty-cupcake.glitch.me',
  withCredentials: true, // This is required for cookies to be sent
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear any local auth state
      localStorage.removeItem('isAuthenticated');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 