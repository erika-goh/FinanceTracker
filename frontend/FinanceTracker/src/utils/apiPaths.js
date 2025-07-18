const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Transaction endpoints
  TRANSACTIONS: `${BASE_URL}/transactions`,
  TRANSACTION: (id) => `${BASE_URL}/transactions/${id}`,

  // Summary endpoints
  SUMMARY: `${BASE_URL}/summary`,

  // Budget endpoints
  BUDGETS: `${BASE_URL}/budgets`,
  BUDGET: (id) => `${BASE_URL}/budgets/${id}`,
};

export const CATEGORIES = {
  INCOME: [
    'Salary',
    'Freelance',
    'Investment',
    'Business',
    'Other Income'
  ],
  EXPENSE: [
    'Food & Dining',
    'Transportation',
    'Housing',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Education',
    'Travel',
    'Other Expenses'
  ]
};
