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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If we get an unauthorized error from the API, we could force a logout
      // or redirect to /sign-in depending on the app flow.
      console.warn('Unauthorized API call detected', error.response.data);
    }
    return Promise.reject(error);
  }
);
