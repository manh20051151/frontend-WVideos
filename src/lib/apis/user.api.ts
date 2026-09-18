import axiosClient from './axiosClient';
import type { VideoResponse } from '@/types';

export interface UserProfileResponse {
  id: string;
  slug?: string; // Slug kênh cho link /channel/{slug}
  email: string;
  fullName: string;
  avatar: string;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  isSubscribed: boolean | null;
  videos: VideoResponse[];
}

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

  getUserProfile: (userId: string): Promise<UserProfileResponse> => {
    return axiosClient.get(`/users/${userId}/profile`);
  },

  search: (
    keyword: string,
    page = 0,
    size = 10,
  ): Promise<{
    content: Array<{ id: string; fullName?: string; email: string; avatar?: string }>;
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
  }> => {
    return axiosClient.get('/users/search', { params: { keyword, page, size } });
  },
};
