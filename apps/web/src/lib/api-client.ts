import axios from 'axios';
import { authClient } from './auth'; // ✅ sesuai path auth.ts kamu di web/src/lib/auth.ts

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const session = await authClient.getSession();
  const token = session?.data?.session?.token;
  console.log('Session token:', token ? 'ADA' : 'KOSONG');
  console.log('Session data:', JSON.stringify(session?.data?.session));
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);