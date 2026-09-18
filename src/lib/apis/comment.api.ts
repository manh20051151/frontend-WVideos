import axiosClient from './axiosClient';
import type { CommentResponse, CommentRequest, CommentModerationRequest, CommentReactionResponse, CommentStatus, Page } from '@/types/comment.types';

type CommentReactionType = 'LIKE' | 'DISLIKE';

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
   * Tổng số comments của video (bao gồm cả trả lời, loại comments đã xóa)
   */
  getVideoCommentsCount: async (videoId: string): Promise<number> => {
    return axiosClient.get(`/videos/${videoId}/comments/count`);
  },
  
  /**
   * Tạo comment mới (status = APPROVED)
   */
  createComment: async (
    videoId: string, 
    content: string
  ): Promise<CommentResponse> => {
    const request: CommentRequest = { content };
    return axiosClient.post(`/videos/${videoId}/comments`, request);
  },
  
  /**
   * Trả lời một bình luận
   */
  createReply: async (
    videoId: string,
    parentId: string,
    content: string
  ): Promise<CommentResponse> => {
    const request: CommentRequest = { content, parentId };
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
   * Sửa comment khi đang PENDING/APPROVED
   */
  editComment: async (
    videoId: string, 
    commentId: string, 
    content: string
  ): Promise<CommentResponse> => {
    return axiosClient.put(`/videos/${videoId}/comments/${commentId}`, { content });
  },

  /**
   * Like/dislike comment (gọi lại cùng loại sẽ bỏ phản ứng)
   * Comment có điểm cao (like - dislike) sẽ xếp lên đầu
   */
  reactToComment: async (
    commentId: string,
    reactionType: CommentReactionType
  ): Promise<CommentReactionResponse> => {
    return axiosClient.post(`/comments/${commentId}/reactions`, { reactionType });
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
   * Admin: Lấy tất cả comments (tìm kiếm + lọc theo trạng thái)
   */
  getAllComments: async (
    page: number = 0,
    size: number = 20,
    search?: string,
    status?: CommentStatus
  ): Promise<Page<CommentResponse>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return axiosClient.get(`/admin/comments?${params.toString()}`);
  },

  /**
   * Admin: Xóa comment (kèm toàn bộ reply và reaction)
   */
  adminDeleteComment: async (commentId: string): Promise<void> => {
    return axiosClient.delete(`/admin/comments/${commentId}`);
  },

  /**
   * Admin: Khóa bình luận của user trong X giờ
   */
  banUserCommenting: async (
    userId: string,
    hours: number,
    reason: string
  ): Promise<import('@/types/auth.types').UserResponse> => {
    return axiosClient.post(`/users/${userId}/comment-ban`, { hours, reason });
  },

  /**
   * Admin: Mở khóa bình luận cho user
   */
  removeCommentBan: async (userId: string): Promise<import('@/types/auth.types').UserResponse> => {
    return axiosClient.delete(`/users/${userId}/comment-ban`);
  },
  
  /**
   * Admin: Đếm số pending comments
   */
  getPendingCommentsCount: async (): Promise<number> => {
    return axiosClient.get('/admin/comments/pending/count');
  },
};

export default commentApi;
