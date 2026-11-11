import api from './axios';

export const getClassReport = async (classId) => {
  const response = await api.get(`/reports/class/${classId}`);
  return response.data;
};

export const getStudentReport = async (studentId) => {
  const response = await api.get(`/reports/student/${studentId}`);
  return response.data;
};

export const getMissingMarks = async (classId) => {
  const response = await api.get(`/reports/missing/${classId}`);
  return response.data;
};

const downloadBlob = (data, format, baseName) => {
  const mimeTypes = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  };
  const blob = new Blob([data], { type: mimeTypes[format] || 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseName}-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportClassReport = async (classId, format) => {
  const response = await api.get(`/reports/class/${classId}/export`, {
    params: { format },
    responseType: 'blob',
  });
  downloadBlob(response.data, format, 'class-report');
};

export const exportMissingReport = async (classId, format) => {
  const response = await api.get(`/reports/missing/${classId}/export`, {
    params: { format },
    responseType: 'blob',
  });
  downloadBlob(response.data, format, 'missing-marks');
};