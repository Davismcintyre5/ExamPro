import api from './axios';

export const getStaff = async () => {
  const response = await api.get('/auth/staff');
  return response.data;
};

export const createStaff = async (staffData) => {
  const response = await api.post('/auth/staff', staffData);
  return response.data;
};

export const updateStaff = async (id, staffData) => {
  const response = await api.put(`/auth/staff/${id}`, staffData);
  return response.data;
};

export const toggleStaffStatus = async (id) => {
  const response = await api.put(`/auth/staff/${id}/toggle`);
  return response.data;
};

export const resetStaffPassword = async (id) => {
  const response = await api.put(`/auth/staff/${id}/reset-password`);
  return response.data;
};

export const deleteStaff = async (id) => {
  const response = await api.delete(`/auth/staff/${id}`);
  return response.data;
};