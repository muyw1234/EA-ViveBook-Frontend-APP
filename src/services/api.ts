import axios from 'axios';
import { environment } from '../config/environment';
import { clearSession, getValidSessionToken } from './session';

const api = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getValidSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? '');
    const isAuthenticationRequest = ['/auth/signin', '/auth/signup', '/auth/social-login'].some(
      (path) => requestUrl.includes(path),
    );
    const hadAuthenticatedRequest = Boolean(error.config?.headers?.Authorization);

    if ((status === 401 || status === 403) && hadAuthenticatedRequest && !isAuthenticationRequest) {
      await clearSession('rejected');
    }

    return Promise.reject(error);
  },
);

export default api;
