import axios from 'axios';

export const apiClient = axios.create({
  // Paksa pakai path relatif biar kena Proxy vercel.json
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error buat debug
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);