import axios from 'axios';

// Base Axios instance matching the Backend Express Server port
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  // Vitally important for Better Auth: ensure cookies (session_token) 
  // are always sent with every cross-origin request
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Intercept responses to handle global 401s
// apps/web/src/lib/api-client.ts

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // CROSS-CHECK: Hanya log warning jika statusnya BUKAN 401 
    // atau jika lo bener-bener butuh debug.
    if (error.response?.status === 401) {
      // Kita biarin diam, karena SettingsContext udah nanganin log-nya dengan lebih rapi (pake info, bukan warn)
    } else if (error.response) {
      console.error('API Error:', error.response.data);
    }
    return Promise.reject(error);
  }
);