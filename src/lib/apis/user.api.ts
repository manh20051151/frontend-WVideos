import axiosClient from './axiosClient';

export const userApi = {
  getAll: (params?: any) => {
    return axiosClient.get('/users', { params });
  },

  getById: (id: string) => {
    return axiosClient.get(`/users/${id}`);
  },

  update: (id: string, data: any) => {
    return axiosClient.put(`/users/${id}`, data);
  },

  delete: (id: string) => {
    return axiosClient.delete(`/users/${id}`);
  },

  getVideos: (id: string, params?: any) => {
    return axiosClient.get(`/users/${id}/videos`, { params });
  },

  follow: (id: string) => {
    return axiosClient.post(`/users/${id}/follow`);
  },

  unfollow: (id: string) => {
    return axiosClient.delete(`/users/${id}/follow`);
  },
};
