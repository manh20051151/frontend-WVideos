import axiosClient from './axiosClient';
import type { ApiResponse, PageResponse, VideoUploadData, VideoResponse } from '@/types';

export type { VideoUploadData, VideoResponse, PageResponse };

const videoApi = {
  // Upload video
  uploadVideo: async (file: File, data: VideoUploadData): Promise<VideoResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    const response: ApiResponse<VideoResponse> = await axiosClient.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.result!;
  },

  // Get my videos
  getMyVideos: async (page = 0, size = 10): Promise<PageResponse<VideoResponse>> => {
    const response: ApiResponse<PageResponse<VideoResponse>> = await axiosClient.get('/videos/my-videos', {
      params: { page, size, sortBy: 'createdAt', sortDir: 'DESC' },
    });
    return response.result!;
  },

  // Get public videos
  getPublicVideos: async (page = 0, size = 10): Promise<PageResponse<VideoResponse>> => {
    const response: ApiResponse<PageResponse<VideoResponse>> = await axiosClient.get('/videos/public', {
      params: { page, size, sortBy: 'createdAt', sortDir: 'DESC' },
    });
    return response.result!;
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<VideoResponse> => {
    const response: ApiResponse<VideoResponse> = await axiosClient.get(`/videos/${videoId}`);
    return response.result!;
  },

  // Update video
  updateVideo: async (videoId: string, data: { title?: string; description?: string; isPublic?: boolean; categoryIds?: string[] }): Promise<VideoResponse> => {
    const response: ApiResponse<VideoResponse> = await axiosClient.put(`/videos/${videoId}`, data);
    return response.result!;
  },

  // Delete video
  deleteVideo: async (videoId: string): Promise<void> => {
    await axiosClient.delete(`/videos/${videoId}`);
  },

  // Increment views
  incrementViews: async (videoId: string): Promise<void> => {
    await axiosClient.post(`/videos/${videoId}/view`);
  },

  // Sync video info from DoodStream
  syncVideoInfo: async (videoId: string): Promise<VideoResponse> => {
    const response: ApiResponse<VideoResponse> = await axiosClient.post(`/videos/${videoId}/sync`);
    return response.result!;
  },
};

export default videoApi;
