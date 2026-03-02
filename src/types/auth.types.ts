/**
 * Payload gửi lên khi đăng ký tài khoản
 */
export interface RegisterRequest {
    username: string;
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
    username: string;
    email: string;
    fullName: string;
    numberPhone: string;
    avatar?: string;
    gender?: boolean;
    roles?: Array<{
        name: string;
        description: string;
    }>;
}
