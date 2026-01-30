import axiosClient from './axiosClient';

export interface VideoUploadData {
  title: string;
  description?: string;
  isPublic?: boolean;
}

export interface VideoResponse {
  id: string;
  title: string;
  description?: string;
  fileCode: string;
  downloadUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  splashImageUrl: string;
  fileSize: number;
  duration: number;
  views: number;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';
  isPublic: boolean;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const videoApi = {
  // Upload video
  uploadVideo: async (file: File, data: VideoUploadData): Promise<VideoResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    const response = await axiosClient.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.result;
  },

  // Get my videos
  getMyVideos: async (page = 0, size = 10): Promise<PageResponse<VideoResponse>> => {
    const response = await axiosClient.get('/videos/my-videos', {
      params: { page, size, sortBy: 'createdAt', sortDir: 'DESC' },
    });
    return response.result;
  },

  // Get public videos
  getPublicVideos: async (page = 0, size = 10): Promise<PageResponse<VideoResponse>> => {
    const response = await axiosClient.get('/videos/public', {
      params: { page, size, sortBy: 'createdAt', sortDir: 'DESC' },
    });
    return response.result;
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<VideoResponse> => {
    const response = await axiosClient.get(`/videos/${videoId}`);
    return response.result;
  },

  // Update video
  updateVideo: async (videoId: string, data: Partial<VideoUploadData>): Promise<VideoResponse> => {
    const response = await axiosClient.put(`/videos/${videoId}`, data);
    return response.result;
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
    const response = await axiosClient.post(`/videos/${videoId}/sync`);
    return response.result;
  },
};

export default videoApi;
