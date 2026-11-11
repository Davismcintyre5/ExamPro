import api from './axios';

const downloadBlob = (data, format, baseName) => {
  const mimeTypes = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf'
  };
  const blob = new Blob([data], { type: mimeTypes[format] });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseName}-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getScoresByClass = async (classId) => {
  const response = await api.get(`/scores/class/${classId}`);
  return response.data;
};

export const getScoresByUnit = async (unitId) => {
  const response = await api.get(`/scores/unit/${unitId}`);
  return response.data;
};

export const getScoresByStudent = async (studentId) => {
  const response = await api.get(`/scores/student/${studentId}`);
  return response.data;
};

export const saveBulkScores = async (data) => {
  const response = await api.post('/scores/bulk', data);
  return response.data;
};

export const pasteScores = async (classId, unitId, rows) => {
  const response = await api.post('/scores/paste', { classId, unitId, rows });
  return response.data;
};

export const importScores = async (classId, unitId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('classId', classId);
  formData.append('unitId', unitId);
  const response = await api.post('/scores/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const exportScores = async (classId, unitId, format) => {
  const response = await api.get('/scores/export', {
    params: { classId, unitId, format },
    responseType: 'blob'
  });
  downloadBlob(response.data, format, 'marks');
  return true;
};

export const unlockScores = async (classId, unitId) => {
  const response = await api.post('/scores/unlock', { classId, unitId });
  return response.data;
};

export const updateScore = async (id, data) => {
  const response = await api.put(`/scores/${id}`, data);
  return response.data;
};

export const deleteScore = async (id) => {
  const response = await api.delete(`/scores/${id}`);
  return response.data;
};