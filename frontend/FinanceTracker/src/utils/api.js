import axios from 'axios';
import { API_ENDPOINTS } from './apiPaths.js';

// Create axios instance with environment-based base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Transactions API
export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  create: (transaction) => api.post('/transactions', transaction),
  update: (id, transaction) => api.put(`/transactions/${id}`, transaction),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Summary API
export const summaryAPI = {
  getSummary: () => api.get('/summary'),
};

// Budgets API
export const budgetsAPI = {
  getAll: () => api.get('/budgets'),
  create: (budget) => api.post('/budgets', budget),
  update: (id, budget) => api.put(`/budgets/${id}`, budget),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export default api; 