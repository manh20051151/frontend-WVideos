import axiosClient from './axiosClient';
import type { ApiResponse, PageResponse, VideoUploadData, VideoResponse, VideoReactionType } from '@/types';

export type { VideoUploadData, VideoResponse, PageResponse };

export interface VideoReactionResponse {
  likeCount: number;
  dislikeCount: number;
  userReaction: VideoReactionType;
}

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

  // Get my videos (không bao gồm đã xóa)
  getMyVideos: async (page = 0, size = 10): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/my-videos', {
      params: { page, size, sortBy: 'createdAt', sortDir: 'DESC' },
    });
  },

  // Get deleted videos (thùng rác)
  getDeletedVideos: async (page = 0, size = 10): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/deleted', {
      params: { page, size, sortBy: 'createdAt', sortDir: 'DESC' },
    });
  },

  // Restore video
  restoreVideo: async (videoId: string): Promise<VideoResponse> => {
    return await axiosClient.post(`/videos/${videoId}/restore`);
  },

  // Get public videos (sorted)
  getPublicVideos: async (page = 0, size = 10, sort = 'newest'): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/public', {
      params: { page, size, sort },
    });
  },

  // Get all videos (sorted) - cho người đăng nhập
  getAllVideos: async (page = 0, size = 10, sort = 'newest'): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/all', {
      params: { page, size, sort },
    });
  },

  // Get trending videos (sorted by views) - hiển thị tất cả video (bao gồm private)
  getTrendingVideos: async (page = 0, size = 8): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/all', {
      params: { page, size, sort: 'popular' },
    });
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<VideoResponse> => {
    return await axiosClient.get(`/videos/${videoId}`);
  },

  // Update video
  updateVideo: async (videoId: string, data: { title?: string; description?: string; isPublic?: boolean; categoryIds?: string[]; thumbnailUrl?: string | null }): Promise<VideoResponse> => {
    return await axiosClient.put(`/videos/${videoId}`, data);
  },

  // Delete video
  deleteVideo: async (videoId: string): Promise<void> => {
    await axiosClient.delete(`/videos/${videoId}`);
  },

  // Increment views
  incrementViews: async (videoId: string): Promise<void> => {
    return axiosClient.post(`/videos/${videoId}/view`);
  },

  // Sync video info from DoodStream
  syncVideoInfo: async (videoId: string): Promise<VideoResponse> => {
    return axiosClient.post(`/videos/${videoId}/sync`);
  },

  // Toggle reaction (like/dislike)
  toggleReaction: async (videoId: string, reactionType: VideoReactionType): Promise<VideoReactionResponse> => {
    return axiosClient.post(`/videos/${videoId}/reactions`, { reactionType });
  },

  // Get reaction counts
  getReactions: async (videoId: string): Promise<VideoReactionResponse> => {
    return axiosClient.get(`/videos/${videoId}/reactions`);
  },

  // Get related videos
  getRelatedVideos: async (videoId: string, page: number = 0, size: number = 6): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get(`/videos/${videoId}/related`, {
      params: { page, size },
    });
  },
};

export default videoApi;
