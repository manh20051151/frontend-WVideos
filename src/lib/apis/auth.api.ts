import axiosClient from './axiosClient';

export const authApi = {
  login: (data: { username: string; password: string }) => {
    return axiosClient.post('/auth/login', data);
  },

  register: (data: { username: string; email: string; password: string }) => {
    return axiosClient.post('/auth/register', data);
  },

  logout: () => {
    return axiosClient.post('/auth/logout');
  },

  getProfile: () => {
    return axiosClient.get('/auth/profile');
  },

  updateProfile: (data: any) => {
    return axiosClient.put('/auth/profile', data);
  },
};
