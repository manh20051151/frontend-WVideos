import type { Category } from '@/lib/apis/category.api';

/**
 * Dữ liệu gửi lên khi upload video
 */
export interface VideoUploadData {
    title: string;
    description?: string;
    isPublic?: boolean;
    categoryIds: string[]; // Danh sách ID của các thể loại (yêu cầu ít nhất 3)
}

/**
 * Trạng thái xử lý video
 */
export type VideoStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';

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
    status: VideoStatus;
    isPublic: boolean;
    categories: Category[]; // Danh sách các thể loại
    userId: string;
    username: string;
    createdAt: string;
    updatedAt: string;
}
