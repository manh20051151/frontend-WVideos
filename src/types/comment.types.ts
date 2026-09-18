// Comment types cho WVideos Frontend

export enum CommentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CommentResponse {
  id: string;
  content: string;
  userId: string;
  userFullName: string;
  userAvatar?: string;
  videoId: string;
  videoTitle?: string; // Tiêu đề video (cho trang admin)
  videoSlug?: string;  // Slug video cho link /watch/{slug}
  parentId?: string;
  replies: CommentResponse[];
  createdAt: string;
  isDeleted: boolean;
  isEdited?: boolean; // Bình luận đã được chỉnh sửa

  // Reactions
  likeCount?: number;
  dislikeCount?: number;
  userReaction?: 'LIKE' | 'DISLIKE' | null;

  // Moderation fields
  status: CommentStatus;
  moderatedById?: string;
  moderatedByName?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  canView: boolean;  // Frontend dùng để quyết định hiện/ẩn content
}

export interface CommentReactionResponse {
  likeCount: number;
  dislikeCount: number;
  userReaction: 'LIKE' | 'DISLIKE' | null;
}

export interface CommentRequest {
  content: string;
  parentId?: string; // Id comment cha nếu là trả lời
}

export interface CommentModerationRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  editedContent?: string;  // Admin có thể edit content
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
