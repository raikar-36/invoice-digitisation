import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  verifyPassword: (password) => api.post('/auth/verify-password', { password })
};

// User endpoints
export const userAPI = {
  getAll: () => api.get('/users'),
  create: (userData) => api.post('/users', userData),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  reactivate: (id) => api.patch(`/users/${id}/reactivate`),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`)
};

// Invoice endpoints
export const invoiceAPI = {
  upload: (formData) => api.post('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  getDocuments: (id) => api.get(`/invoices/${id}/documents`),
  getOcrData: (id) => api.get(`/invoices/${id}/ocr`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  submit: (id, data) => api.post(`/invoices/${id}/submit`, data),
  approve: (id, data) => api.post(`/invoices/${id}/approve`, data),
  reject: (id, data) => api.post(`/invoices/${id}/reject`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  generatePdf: (id) => api.post(`/invoices/${id}/generate-pdf`),
  downloadDocument: (invoiceId, documentId) => 
    api.get(`/invoices/${invoiceId}/documents/${documentId}`, { responseType: 'blob' }),
  checkDuplicate: (data) => api.post('/invoices/check-duplicate', data),
  logDuplicateIgnored: (data) => api.post('/invoices/log-duplicate-ignored', data),
  getCreatorsList: (params) => api.get('/invoices/creators', { params })
};

// Customer endpoints
export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  matchCustomer: (data) => api.post('/invoices/match-customer', data)
};

// Product endpoints
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  search: (query) => api.get('/products/search', { params: { q: query } }),
  getPriceRange: (id) => api.get(`/products/${id}/price-range`),
  findSimilar: (name) => api.post('/products/find-similar', { name }),
  create: (data) => api.post('/products', data)
};

// Report endpoints
export const reportAPI = {
  getDashboard: (params) => api.get('/reports/dashboard', { params }),
  getRevenueFlow: (params) => api.get('/reports/revenue-flow', { params }),
  getTopCustomers: (params) => api.get('/reports/top-customers', { params }),
  getProductPerformance: () => api.get('/reports/product-performance'),
  getWeeklyPattern: () => api.get('/reports/weekly-pattern'),
  getStatusDistribution: () => api.get('/reports/status-distribution')
};

// Audit endpoints
export const auditAPI = {
  getInvoiceAudit: (id) => api.get(`/audit/invoice/${id}`),
  getAllAudit: (params) => api.get('/audit', { params })
};

export default api;
