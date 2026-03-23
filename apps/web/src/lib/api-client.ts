import axios from 'axios';

export const apiClient = axios.create({
  // 🔥 WAJIB: Paksa pakai path relatif biar lewat Proxy vercel.json
  // Ini kunci biar Cookie lo dikirim dan gak 401 lagi
  baseURL: '/api',

  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("User unauthenticated, pipe broken.");
    } else if (error.response) {
      console.error('API Error:', error.response.data);
    }
    return Promise.reject(error);
  }
);