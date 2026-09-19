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
    price?: number; // Giá video (VND), 0 = miễn phí
}

/**
 * Video trong shorts feed (TikTok style)
 */
export interface ShortsResponse {
    id: string;
    title: string;
    slug?: string; // Slug URL-friendly cho link /watch/{slug}
    streamUrl: string | null; // direct mp4 URL đã resolve
    thumbnailUrl: string;
    splashImageUrl: string;
    userFullName: string;
    userId?: string; // ID tác giả (dùng để theo dõi kênh)
    avatarUrl?: string; // ảnh đại diện người đăng
    duration: number;
    views: number;
    likeCount?: number;
    isLiked?: boolean;
    price?: number;
    isPaid?: boolean;
    purchased?: boolean;
    isOwner?: boolean;
    isPublic?: boolean; // false = video riêng tư
    requireLogin?: boolean; // true = phải đăng nhập mới xem được (video riêng tư + chưa đăng nhập)
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
    slug?: string; // Slug URL-friendly cho link /watch/{slug}
    description?: string;
    fileCode: string;
    downloadUrl: string;
    embedUrl: string;
    thumbnailUrl: string;
    splashImageUrl: string;
    fileSize: number;
    duration: number;
    views: number;
    favoritesCount?: number;
    commentsCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    userReaction?: VideoReactionType;
    status: VideoStatus;
    isPublic: boolean;
    price?: number;        // Giá video (VND), 0 = miễn phí
    isPurchased?: boolean;  // User hiện tại đã mua chưa
    hasAccess?: boolean;    // User hiện tại có quyền xem (owner | miễn phí | đã mua)
    categories: Category[];
    tags?: string[];
    userId: string;
    userFullName: string;
    userAvatar?: string;
    userSlug?: string; // Slug kênh cho link /channel/{slug}
    subscriberCount?: number;
    isSubscribed?: boolean;
    createdAt: string;
    updatedAt: string;
}
