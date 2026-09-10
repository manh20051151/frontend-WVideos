import type { Category } from '@/lib/apis/category.api';

/**
 * Dữ liệu gửi lên khi upload video
 */
export interface VideoUploadData {
    title: string;
    description?: string;
    isPublic?: boolean;
    categoryIds: string[]; // Danh sách ID của các thể loại (yêu cầu ít nhất 3)
    tags?: string[]; // Tags cho video (tối đa 10 tags)
    thumbnailUrl?: string; // URL ảnh thumbnail tùy chọn
    duration?: number; // Thời lượng video (giây), đọc từ metadata trước khi upload
}

/**
 * Video trong shorts feed (TikTok style)
 */
export interface ShortsResponse {
    id: string;
    title: string;
    streamUrl: string | null; // direct mp4 URL đã resolve
    thumbnailUrl: string;
    splashImageUrl: string;
    userFullName: string;
    duration: number;
    views: number;
    likeCount?: number;
    isLiked?: boolean;
    createdAt: string;
}

/**
 * Trạng thái xử lý video
 */
export type VideoStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';

/**
 * Loại reaction
 */
export type VideoReactionType = 'LIKE' | 'DISLIKE' | null;

/**
 * Thông tin chi tiết của một video
 */
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
    likeCount?: number;
    dislikeCount?: number;
    userReaction?: VideoReactionType;
    status: VideoStatus;
    isPublic: boolean;
    categories: Category[];
    tags?: string[];
    userId: string;
    userFullName: string;
    subscriberCount?: number;
    isSubscribed?: boolean;
    createdAt: string;
    updatedAt: string;
}
