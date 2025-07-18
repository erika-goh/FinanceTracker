import axios from 'axios';
import { API_ENDPOINTS } from './apiPaths.js';

// Create axios instance
const api = axios.create({
  baseURL: API_ENDPOINTS.TRANSACTIONS.replace(/\/transactions.*/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transaction API
export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Summary API
export const summaryAPI = {
  getSummary: () => api.get('/summary'),
};

// Budgets API
export const budgetsAPI = {
  getAll: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export default api; 