import axios from 'axios';

// Set default base URL
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Set default credentials config
// Note: We're NOT using withCredentials since we're using token-based auth
// axios.defaults.withCredentials = false;

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    // Handle specific error cases
    if (response && response.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;