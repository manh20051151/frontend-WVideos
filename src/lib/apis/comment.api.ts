import axiosClient from './axiosClient';
import { CommentResponse, CommentRequest, CommentModerationRequest, Page } from '@/types/comment.types';

const commentApi = {
  // ==================== USER APIs ====================
  
  /**
   * Lấy danh sách comments của video
   * Guest: chỉ thấy APPROVED
   * User: thấy APPROVED + pending của mình
   * Admin: thấy tất cả
   */
  getVideoComments: async (
    videoId: string, 
    page: number = 0, 
    size: number = 20
  ): Promise<Page<CommentResponse>> => {
    return axiosClient.get(`/videos/${videoId}/comments?page=${page}&size=${size}`);
  },
  
  /**
   * Tạo comment mới (status = PENDING)
   */
  createComment: async (
    videoId: string, 
    content: string
  ): Promise<CommentResponse> => {
    const request: CommentRequest = { content };
    return axiosClient.post(`/videos/${videoId}/comments`, request);
  },
  
  /**
   * Xóa comment của mình
   */
  deleteComment: async (
    videoId: string, 
    commentId: string
  ): Promise<void> => {
    return axiosClient.delete(`/videos/${videoId}/comments/${commentId}`);
  },
  
  /**
   * Sửa comment khi đang PENDING
   */
  editComment: async (
    videoId: string, 
    commentId: string, 
    content: string
  ): Promise<CommentResponse> => {
    return axiosClient.put(`/videos/${videoId}/comments/${commentId}`, { content });
  },
  
  // ==================== ADMIN APIs ====================
  
  /**
   * Admin: Lấy danh sách pending comments
   */
  getPendingComments: async (
    page: number = 0, 
    size: number = 20
  ): Promise<Page<CommentResponse>> => {
    return axiosClient.get(`/admin/comments/pending?page=${page}&size=${size}`);
  },
  
  /**
   * Admin: Duyệt hoặc từ chối comment
   */
  moderateComment: async (
    commentId: string, 
    data: CommentModerationRequest
  ): Promise<CommentResponse> => {
    return axiosClient.post(`/admin/comments/${commentId}/moderate`, data);
  },
  
  /**
   * Admin: Lấy tất cả comments
   */
  getAllComments: async (
    page: number = 0, 
    size: number = 20
  ): Promise<Page<CommentResponse>> => {
    return axiosClient.get(`/admin/comments?page=${page}&size=${size}`);
  },
  
  /**
   * Admin: Đếm số pending comments
   */
  getPendingCommentsCount: async (): Promise<number> => {
    return axiosClient.get('/admin/comments/pending/count');
  },
};

export default commentApi;
