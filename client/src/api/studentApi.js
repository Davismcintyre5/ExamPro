import api from './axios';

export const getStudents = async (params) => {
  const response = await api.get('/students', { params });
  return response.data;
};

export const getStudentById = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const getStudentsByClass = async (classId) => {
  const response = await api.get(`/students/class/${classId}`);
  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await api.post('/students', studentData);
  return response.data;
};

export const createBulkStudents = async (bulkData) => {
  const response = await api.post('/students/bulk', bulkData);
  return response.data;
};

export const addBulkStudents = async (classId, students) => {
  const response = await api.post('/students/bulk-add', { classId, students });
  return response.data;
};

export const updateStudent = async (id, studentData) => {
  const response = await api.put(`/students/${id}`, studentData);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

export const exportStudents = async (params) => {
  const response = await api.get('/students/export', {
    params,
    responseType: 'blob',
  });

  const format = params.format || 'csv';
  const mimeTypes = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  };

  const blob = new Blob([response.data], { type: mimeTypes[format] || 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const date = new Date().toISOString().split('T')[0];
  link.download = `students-${date}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return true;
};

export const importStudents = async (classId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('classId', classId);

  const response = await api.post('/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};