import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

const API_KEY = import.meta.env.VITE_API_KEY || 'super-secret-api-key-change-in-production';

export interface Transaction {
  id: string;
  reference: string;
  account: string;
  date: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  createdAt: string;
}

export interface AccountSummary {
  account: string;
  balance: string;
  total_inflow: string;
  total_outflow: string;
}

export interface CategorySummary {
  inflow: Record<string, string>;
  outflow: Record<string, string>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export const usersApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<User>('/users', data).then((r) => r.data),
  list: () => api.get<User[]>('/users').then((r) => r.data),
};

export const transactionsApi = {
  list: (params?: { account?: string; startDate?: string; endDate?: string }) =>
    api.get<Transaction[]>('/transactions', { params }).then((r) => r.data),

  create: (data: Omit<Transaction, 'id' | 'createdAt'>) =>
    api
      .post<Transaction>('/transactions', data, {
        headers: { 'X-API-Key': API_KEY },
      })
      .then((r) => r.data),

  createBulk: (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) =>
    api
      .post<{ created: number; skipped: number; errors: string[] }>(
        '/transactions/bulk',
        { transactions },
        { headers: { 'X-API-Key': API_KEY } },
      )
      .then((r) => r.data),
};

export const summaryApi = {
  accounts: (params?: { startDate?: string; endDate?: string }) =>
    api.get<AccountSummary[]>('/summary/accounts', { params }).then((r) => r.data),

  categories: (params?: { startDate?: string; endDate?: string }) =>
    api.get<CategorySummary>('/summary/categories', { params }).then((r) => r.data),
};
