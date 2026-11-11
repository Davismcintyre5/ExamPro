import api from './axios';

export const getPlatformSettings = async () => {
  const response = await api.get('/platform-settings');
  return response.data;
};

export const updatePlatformSettings = async (data) => {
  const response = await api.put('/platform-settings', data);
  return response.data;
};

export const getPublicPlatformSettings = async () => {
  const response = await api.get('/platform-settings/public');
  return response.data;
};

export const getPlatformDashboard = async () => {
  const response = await api.get('/platform-settings/dashboard-stats');
  return response.data;
};