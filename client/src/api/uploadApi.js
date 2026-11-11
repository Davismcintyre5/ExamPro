import api from './axios';

export const uploadImage = async (file, type = 'misc') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post(`/uploads/image/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const deleteImage = async (publicId) => {
  const response = await api.delete('/uploads/image', {
    data: { publicId },
  });
  return response.data;
};

export const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};