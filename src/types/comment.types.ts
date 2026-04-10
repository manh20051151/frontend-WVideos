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
  parentId?: string;
  replies: CommentResponse[];
  createdAt: string;
  isDeleted: boolean;
  
  // Moderation fields
  status: CommentStatus;
  moderatedById?: string;
  moderatedByName?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  canView: boolean;  // Frontend dùng để quyết định hiện/ẩn content
}

export interface CommentRequest {
  content: string;
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
