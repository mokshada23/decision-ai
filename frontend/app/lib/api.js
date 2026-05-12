import axios from 'axios';

const API = axios.create({
  baseURL: 'https://decision-ai-production-89e7.up.railway.app',
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const createDecision = (data) => API.post('/decisions', data);
export const getDecisions = () => API.get('/decisions');
export const getDecision = (id) => API.get(`/decisions/${id}`);