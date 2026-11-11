import api from './axios';

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.put('/settings', data);
  return response.data;
};

export const updateGradingSystem = async (data) => {
  const response = await api.put('/settings/grading-system', data);
  return response.data;
};

export const updateGrades = async (grades) => {
  const response = await api.put('/settings/grades', { grades });
  return response.data;
};

export const addGrade = async (gradeData) => {
  const response = await api.post('/settings/grades', gradeData);
  return response.data;
};

export const deleteGrade = async (gradeId) => {
  const response = await api.delete(`/settings/grades/${gradeId}`);
  return response.data;
};