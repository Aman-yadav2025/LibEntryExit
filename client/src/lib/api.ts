import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  // Use the live URL if on Vercel, otherwise fallback to local Next.js '/api' proxy
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ''}/api`,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('setu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('setu_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;