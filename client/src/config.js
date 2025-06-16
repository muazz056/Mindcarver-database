const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://your-backend-domain.onrender.com' // Replace with your Render.com domain
    : 'http://localhost:5000',
};

export default config; 