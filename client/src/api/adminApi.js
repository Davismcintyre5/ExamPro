import api from './axios';

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

export const resetAdminPassword = async (id, password) => {
  const response = await api.put(`/auth/admins/${id}/reset-password`, { password });
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