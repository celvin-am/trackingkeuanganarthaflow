import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    // Fetch langsung ke API, bypass cookie browser
    const res = await fetch('https://arthaflow-api.vercel.app/api/auth/get-session', {
      credentials: 'include',
    });
    const data = await res.json();
    const token = data?.session?.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // silent fail
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