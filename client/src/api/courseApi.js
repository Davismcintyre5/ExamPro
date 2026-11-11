import api from './axios';

export const getCourses = async (params) => {
  const response = await api.get('/courses', { params });
  return response.data;
};

export const getCourseById = async (id) => {
  const response = await api.get(`/courses/${id}`);
  return response.data;
};

export const createCourse = async (data) => {
  const response = await api.post('/courses', data);
  return response.data;
};

export const addBulkCourses = async (departmentId, courses) => {
  const response = await api.post('/courses/bulk', { departmentId, courses });
  return response.data;
};

export const importCourses = async (departmentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('departmentId', departmentId);
  const response = await api.post('/courses/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const exportCourses = async (params) => {
  const response = await api.get('/courses/export', { params, responseType: 'blob' });
  downloadBlob(response.data, params.format || 'csv', 'courses');
  return true;
};

export const updateCourse = async (id, data) => {
  const response = await api.put(`/courses/${id}`, data);
  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await api.delete(`/courses/${id}`);
  return response.data;
};

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