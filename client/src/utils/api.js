import axios from 'axios';
import dayjs from 'dayjs';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;

  // Send the client's local date so the server calculates week boundaries
  // from the user's timezone, not the server's (which is often UTC).
  cfg.headers['X-Client-Date'] = dayjs().format('YYYY-MM-DD');

  return cfg;
});

export default API;
