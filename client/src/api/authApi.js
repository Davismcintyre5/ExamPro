import api from './axios';

export const hiddenAdminLogin = async (credentials) => {
  const response = await api.post('/auth/hidden-admin-login', credentials);
  return response.data;
};

export const hiddenAdminRegister = async (adminData) => {
  const response = await api.post('/auth/hidden-admin-register', adminData);
  return response.data;
};

export const verifyAdminHash = async (accessHash) => {
  const response = await api.post('/auth/verify-admin-hash', { accessHash });
  return response.data;
};

export const getAdminInfo = async () => {
  const response = await api.get('/auth/admin-info');
  return response.data;
};

export const loginTeacher = async (credentials) => {
  const response = await api.post('/auth/teacher-login', credentials);
  return response.data;
};

export const selfRegister = async (data) => {
  const response = await api.post('/auth/self-register', data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export const changeOwnPassword = async (data) => {
  const response = await api.put('/auth/change-password', data);
  return response.data;
};

export const getPendingUsers = async () => {
  const response = await api.get('/auth/pending-users');
  return response.data;
};

export const approveUser = async (id) => {
  const response = await api.post(`/auth/pending-users/${id}/approve`);
  return response.data;
};

export const rejectUser = async (id, reason) => {
  const response = await api.post(`/auth/pending-users/${id}/reject`, { reason });
  return response.data;
};

export const getAdmins = async () => {
  const response = await api.get('/auth/admins');
  return response.data;
};

export const createAdmin = async (adminData) => {
  const response = await api.post('/auth/create-admin', adminData);
  return response.data;
};

export const updateAdmin = async (id, adminData) => {
  const response = await api.put(`/auth/admins/${id}`, adminData);
  return response.data;
};

export const toggleAdminStatus = async (id) => {
  const response = await api.put(`/auth/admins/${id}/toggle`);
  return response.data;
};

export const resetAdminPassword = async (id) => {
  const response = await api.put(`/auth/admins/${id}/reset-password`);
  return response.data;
};

export const resetAdminAttempts = async (id) => {
  const response = await api.put(`/auth/admins/${id}/reset-attempts`);
  return response.data;
};

export const deleteAdmin = async (id) => {
  const response = await api.delete(`/auth/admins/${id}`);
  return response.data;
};