/**
 * Dữ liệu gửi lên khi upload video
 */
export interface VideoUploadData {
    title: string;
    description?: string;
    isPublic?: boolean;
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
    userId: string;
    username: string;
    createdAt: string;
    updatedAt: string;
}
