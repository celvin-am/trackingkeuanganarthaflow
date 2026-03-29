import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://api-arthaflow.celvinandra.my.id/api',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Sesi habis, silakan login ulang.');
    }
    return Promise.reject(error);
  }
);