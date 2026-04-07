import axiosClient from './axiosClient';
import type {
  ApiResponse,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserResponse,
} from '@/types';

export type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserResponse,
};

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
  login: (data: LoginRequest): Promise<AuthResponse> => {
    return axiosClient.post('/auth/token', data);
  },

  // Đăng xuất
  logout: (token: string): Promise<void> => {
    return axiosClient.post('/auth/logout', { token });
  },

  // Refresh token
  refreshToken: (token: string): Promise<AuthResponse> => {
    return axiosClient.post('/auth/refresh', { token });
  },

  // Lấy thông tin user hiện tại
  getMyInfo: (): Promise<UserResponse> => {
    return axiosClient.get('/users/my-info');
  },

  // Quên mật khẩu
  forgotPassword: (email: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/users/forgot-password', { email });
  },

  // Đổi mật khẩu
  changePassword: (data: {
    passwordOld: string;
    passwordNew: string;
  }): Promise<void> => {
    return axiosClient.put('/users/change-password', data);
  },

  // Cập nhật thông tin cá nhân
  updateProfile: (data: {
    fullName?: string;
    numberPhone?: string;
    avatar?: string;
    gender?: boolean;
    bankName?: string;
    bankAccountHolderName?: string;
    bankAccountNumber?: string;
  }): Promise<UserResponse> => {
    return axiosClient.put('/users/my-info', data);
  },

  // Lấy danh sách ngân hàng từ VietQR API
  getBankList: async (): Promise<{ code: string; data: Array<{ code: string; name: string; shortName: string; logo: string }> }> => {
    try {
      const response = await fetch('https://api.vietqr.io/v2/banks');
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi lấy danh sách ngân hàng:', error);
      return { code: 'ERROR', data: [] };
    }
  },
};
