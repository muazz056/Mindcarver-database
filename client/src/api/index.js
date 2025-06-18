import axios from 'axios';

// Create axios instance with custom config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://intermediate-twisty-cupcake.glitch.me/',
  withCredentials: true, // This is required for cookies to be sent
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api; 