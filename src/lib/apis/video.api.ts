import axiosClient from './axiosClient';

export const videoApi = {
  getAll: (params?: any) => {
    return axiosClient.get('/videos', { params });
  },

  getById: (id: string) => {
    return axiosClient.get(`/videos/${id}`);
  },

  create: (data: FormData) => {
    return axiosClient.post('/videos', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  update: (id: string, data: any) => {
    return axiosClient.put(`/videos/${id}`, data);
  },

  delete: (id: string) => {
    return axiosClient.delete(`/videos/${id}`);
  },

  like: (id: string) => {
    return axiosClient.post(`/videos/${id}/like`);
  },

  comment: (id: string, data: { content: string }) => {
    return axiosClient.post(`/videos/${id}/comments`, data);
  },
};
