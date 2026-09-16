import axiosClient from './axiosClient';
import type { ApiResponse, PageResponse, VideoUploadData, VideoResponse, VideoReactionType, ShortsResponse } from '@/types';

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

  // Get my liked videos (video đã thích - reaction LIKE)
  getLikedVideos: async (page = 0, size = 12): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/liked', {
      params: { page, size },
    });
  },

  // Get purchased videos (video đã mua)
  getPurchasedVideos: async (page = 0, size = 10): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/purchased', {
      params: { page, size },
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

  // Get trending videos (lượt xem nhiều nhất trong 24h) - endpoint chuyên biệt
  getTrendingVideos: async (page = 0, size = 8, hours = 24): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/videos/trending', {
      params: { page, size, hours },
    });
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<VideoResponse> => {
    return await axiosClient.get(`/videos/${videoId}`);
  },

  // Mua video có phí
  purchaseVideo: async (videoId: string): Promise<VideoResponse> => {
    return await axiosClient.post(`/videos/${videoId}/purchase`);
  },

  // Update video
  updateVideo: async (videoId: string, data: { title?: string; description?: string; isPublic?: boolean; categoryIds?: string[]; thumbnailUrl?: string; price?: number }): Promise<VideoResponse> => {
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

  // Lấy direct video URL (mp4) từ Streamtape để phát trực tiếp qua <video>
  getStreamtapeStreamUrl: async (url: string): Promise<string | null> => {
    const data = (await axiosClient.get('/videos/streamtape/stream-url', {
      params: { url },
    })) as unknown;
    // Interceptor trả về response.data.result nếu có, ngược lại trả toàn bộ body.
    // Cần unwrap an toàn để tránh nhận object ([object Object]) khi result rỗng.
    if (typeof data === 'string') {
      return data;
    }
    if (data && typeof data === 'object' && typeof (data as { result?: unknown }).result === 'string') {
      return (data as { result: string }).result;
    }
    return null;
  },

  // Lấy shorts feed (TikTok style). Trả kèm streamUrl đã resolve.
  // loop=true: không loại trừ video đã xem để feed lặp vô hạn.
  getShorts: async (params: {
    lastCreatedAt?: string;
    size?: number;
    guestId?: string;
    loop?: boolean;
  } = {}): Promise<ShortsResponse[]> => {
    const response = await axiosClient.get('/videos/shorts', { params });
    return (response as unknown as ShortsResponse[]) ?? [];
  },

  // Đánh dấu video đã xem (ẩn khỏi shorts feed sau này)
  markWatched: async (videoId: string, guestId?: string): Promise<void> => {
    await axiosClient.post(`/videos/${videoId}/watched`, null, {
      params: guestId ? { guestId } : {},
    });
  },
};

export default videoApi;
