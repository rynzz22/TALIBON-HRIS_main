import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'hris_auth_token';

export const AuthStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
  const token = AuthStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Standardized response interception for enterprise error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    console.error(`[Enterprise API Error]: ${message}`);
    return Promise.reject(new Error(message));
  }
);

export const EmployeeAPI = {
  list: () => api.get('/employees'),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

export const AuthAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
};

export const PayrollAPI = {
  list: () => api.get('/payroll'),
  generate: (data: any) => api.post('/payroll', data),
};

export const LeaveAPI = {
  list: () => api.get('/leave'),
  submit: (data: any) => api.post('/leave', data),
  updateStatus: (id: string, status: 'approved' | 'rejected', remarks?: string) => 
    api.put(`/leave/${id}/status`, { status, remarks }),
};

export const AttendanceAPI = {
  list: () => api.get('/attendance'),
  log: (employeeId: string, type: 'in' | 'out') => 
    api.post('/attendance/log', { employeeId, type, date: new Date().toISOString().split('T')[0], time: new Date().toISOString() }),
};

export const AuditAPI = {
  list: () => api.get('/audit'),
  log: (data: { userId: string; userName: string; action: string; target: string }) => 
    api.post('/audit', data),
};

export const NotificationAPI = {
  list: (userId: string) => api.get(`/notifications/${userId}`),
};

export const ReportsAPI = {
  summary: () => api.get('/reports/summary'),
};

export default api;
