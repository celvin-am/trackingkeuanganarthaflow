import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  // 🔥 TAMBAHIN TIMEOUT: Stop muter setelah 15 detik
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      alert("Request timeout! Cek koneksi lo nyet.");
    }
    return Promise.reject(error);
  }
);