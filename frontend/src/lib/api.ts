import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// attach admin token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products
export const getProducts = (params?: any) => api.get('/api/products', { params });
export const getProduct = (id: string) => api.get(`/api/products/${id}`);
export const createProduct = (data: any) => api.post('/api/products', data);
export const updateProduct = (id: string, data: any) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id: string) => api.delete(`/api/products/${id}`);
export const updateVariantStock = (variantId: string, stock: number) => api.put(`/api/products/variants/${variantId}/stock`, { stock });

// Orders
export const createOrder = (data: any) => api.post('/api/orders', data);
export const getOrders = (params?: any) => api.get('/api/orders', { params });
export const getOrder = (id: string) => api.get(`/api/orders/${id}`);
export const updateOrderStatus = (id: string, order_status: string) => api.patch(`/api/orders/${id}/status`, { order_status });

// Payment
export const createPayment = (data: any) => api.post('/api/payment/create', data);
export const getPaymentStatus = (orderId: string) => api.get(`/api/payment/status/${orderId}`);
export const simulatePayment = (order_id: string) => api.post('/api/payment/simulate', { order_id });

// Logistics
export const getLogistics = (orderId: string) => api.get(`/api/logistics/${orderId}`);
export const createLogistics = (order_id: string) => api.post('/api/logistics/create', { order_id });
export const syncLogistics = (orderId: string) => api.post(`/api/logistics/sync/${orderId}`);

// Admin (with explicit token param for header override)
const adminApi = (token: string) => axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
});
export const adminLogin = (username: string, password: string) => api.post('/api/admin/login', { username, password });
export const adminGetStats = (token: string) => adminApi(token).get('/api/admin/stats');
export const adminGetProducts = (token: string) => adminApi(token).get('/api/admin/products');
export const adminGetOrders = (token: string) => adminApi(token).get('/api/admin/orders');
export const adminUpdateProduct = (token: string, id: string, data: any) => adminApi(token).put(`/api/admin/products/${id}`, data);
export const adminUpdateOrderStatus = (token: string, id: string, status: string) => adminApi(token).patch(`/api/admin/orders/${id}/status`, { status });
export const adminCreateLogistics = (token: string, orderId: string) => adminApi(token).post('/api/logistics/create', { order_id: orderId });

// Admin shortcuts (use interceptor token automatically)
export const getStats = () => api.get('/api/admin/stats');
export const updateProductStatus = (id: string, status: string) => api.patch(`/api/products/${id}/status`, { status });

// Helpers
export const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(2)}`;
