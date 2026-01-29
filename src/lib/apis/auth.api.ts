import axiosClient from './axiosClient';

// Interfaces cho request/response
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  numberPhone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  authenticated: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
}

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

export const authApi = {
  // Đăng ký tài khoản
  register: (data: RegisterRequest): Promise<ApiResponse<void>> => {
    return axiosClient.post('/users/register', data);
  },

  // Xác nhận đăng ký qua email token
  confirmRegistration: (token: string): Promise<ApiResponse<UserResponse>> => {
    return axiosClient.get(`/users/confirm?token=${token}`);
  },

  // Đăng nhập
  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return axiosClient.post('/auth/token', data);
  },

  // Đăng xuất
  logout: (token: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/auth/logout', { token });
  },

  // Refresh token
  refreshToken: (token: string): Promise<ApiResponse<AuthResponse>> => {
    return axiosClient.post('/auth/refresh', { token });
  },

  // Lấy thông tin user hiện tại
  getMyInfo: (): Promise<ApiResponse<UserResponse>> => {
    return axiosClient.get('/users/myInfo');
  },

  // Quên mật khẩu
  forgotPassword: (email: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/users/forgot-password', { email });
  },

  // Đổi mật khẩu
  changePassword: (data: {
    passwordOld: string;
    passwordNew: string;
  }): Promise<ApiResponse<void>> => {
    return axiosClient.put('/users/change-password', data);
  },

  // Cập nhật thông tin cá nhân
  updateProfile: (data: {
    fullName?: string;
    numberPhone?: string;
    avatar?: string;
    gender?: boolean;
  }): Promise<ApiResponse<UserResponse>> => {
    return axiosClient.put('/users/my-info', data);
  },
};
