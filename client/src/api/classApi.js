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

export const getClasses = async (params) => {
  const response = await api.get('/classes', { params });
  return response.data;
};

export const getClassById = async (id) => {
  const response = await api.get(`/classes/${id}`);
  return response.data;
};

export const createClass = async (data) => {
  const response = await api.post('/classes', data);
  return response.data;
};

export const addBulkClasses = async (departmentId, courseId, classes) => {
  const response = await api.post('/classes/bulk', { departmentId, courseId, classes });
  return response.data;
};

export const importClasses = async (departmentId, courseId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('departmentId', departmentId);
  formData.append('courseId', courseId);
  const response = await api.post('/classes/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const exportClasses = async (params) => {
  const response = await api.get('/classes/export', { params, responseType: 'blob' });
  downloadBlob(response.data, params.format || 'csv', 'classes');
  return true;
};

export const updateClass = async (id, data) => {
  const response = await api.put(`/classes/${id}`, data);
  return response.data;
};

export const deleteClass = async (id) => {
  const response = await api.delete(`/classes/${id}`);
  return response.data;
};

export const addUnit = async (classId, data) => {
  const response = await api.post(`/classes/${classId}/units`, data);
  return response.data;
};

export const addBulkUnits = async (classId, units) => {
  const response = await api.post(`/classes/${classId}/units/bulk`, { units });
  return response.data;
};

export const importUnits = async (classId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/classes/${classId}/units/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const exportUnits = async (classId, format) => {
  const response = await api.get(`/classes/${classId}/units/export`, {
    params: { format },
    responseType: 'blob'
  });
  downloadBlob(response.data, format, 'units');
  return true;
};

export const updateUnit = async (classId, unitId, data) => {
  const response = await api.put(`/classes/${classId}/units/${unitId}`, data);
  return response.data;
};

export const deleteUnit = async (classId, unitId) => {
  const response = await api.delete(`/classes/${classId}/units/${unitId}`);
  return response.data;
};