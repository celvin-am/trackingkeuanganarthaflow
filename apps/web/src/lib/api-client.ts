import axios from 'axios';
import { authClient } from './auth'; // ✅ sesuai path auth.ts kamu di web/src/lib/auth.ts

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach Bearer token ke setiap request
// Fix untuk Vercel proxy yang strip cookie cross-domain
apiClient.interceptors.request.use(async (config) => {
  const session = await authClient.getSession();
  const token = session?.data?.session?.token;
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