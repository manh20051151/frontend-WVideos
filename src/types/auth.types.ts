/**
 * Payload gửi lên khi đăng ký tài khoản
 */
export interface RegisterRequest {
    password: string;
    email: string;
    fullName: string;
    numberPhone: string;
}

/**
 * Payload gửi lên khi đăng nhập
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Dữ liệu trả về sau khi xác thực thành công
 */
export interface AuthResponse {
    token: string;
    authenticated: boolean;
}

/**
 * Thông tin chi tiết của người dùng
 */
export interface UserResponse {
    id: string;
    slug?: string; // Slug kênh cho link /channel/{slug}
    email: string;
    fullName: string;
    numberPhone: string;
    avatar?: string;
    gender?: boolean;
    roles?: Array<{
        name: string;
        description: string;
    }>;
    joinedDate?: string;
    bankName?: string;
    bankAccountHolderName?: string;
    bankAccountNumber?: string;
    subscriberCount?: number;
    balance?: number;
    revenue?: number;

    // Khóa bình luận (admin)
    commentBannedUntil?: string;
    commentBanReason?: string;
}
