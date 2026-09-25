import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Các endpoint công khai (tương ứng PUBLIC_ENDPOINTS_GET trong SecurityConfig backend).
// Nếu token cũ hết hạn, backend vẫn trả 401 vì oauth2ResourceServer xử lý mọi Authorization header.
// Với các endpoint này: thử lại KHÔNG kèm token thay vì logout người dùng.
const PUBLIC_GET_PATHS = [
  '/nav-items',
  '/footer',
  '/categories',
  '/videos/public',
  '/videos/all',
  '/videos/trending',
  '/videos/shorts',
  '/news',
  '/news-categories',
  '/search',
];

// Kiểm tra path có thuộc danh sách public không (so khớp tiền tố)
const isPublicPath = (url: string) =>
  PUBLIC_GET_PATHS.some((p) => url === p || url.startsWith(p + '/'));

// Đọc locale người dùng chọn từ cookie NEXT_LOCALE do next-intl ghi
const readLocaleCookie = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('NEXT_LOCALE='));
  return match ? decodeURIComponent(match.split('=')[1]) : undefined;
};

// Flag để tránh multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const url = config.url || '';
    // Không gắn Authorization header cho các endpoint xác thực công khai (/auth/...)
    // vì oauth2ResourceServer sẽ reject request ngay cả khi endpoint là permitAll
    // nếu token cũ đã hết hạn -> gây lỗi 401 khi đăng nhập bằng tài khoản đúng
    const isPublicAuthEndpoint = url.includes('/auth/');
    if (token && !isPublicAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Backend trả message lỗi + tên danh mục theo ngôn ngữ này.
    // Ưu tiên cookie NEXT_LOCALE do next-intl set khi người dùng đổi ngôn ngữ
    // (script set <html lang> không chạy lại khi chuyển locale phía client),
    // fallback về lang của document rồi mặc định vi.
    const locale =
      (typeof document !== 'undefined' && readLocaleCookie()) ||
      (typeof document !== 'undefined' && document.documentElement.lang) ||
      'vi';
    config.headers['Accept-Language'] = locale;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor với auto-refresh token chỉ khi token hết hạn
axiosClient.interceptors.response.use(
  (response) => {
    // Return response.data.result để lấy data thực từ ApiResponse<T>
    // Nếu không có result (response trực tiếp), return response.data
    return response.data?.result !== undefined ? response.data.result : response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const hasToken = !!localStorage.getItem('token');

    
    // Chỉ refresh khi: lỗi 401 + code 5002 (TOKEN_EXPIRED) + chưa retry + không phải request refresh
    const isTokenExpired = error.response?.status === 401 && 
                           error.response?.data?.code === 5002;
    
    
    // Nếu lỗi 401 nhưng KHÔNG phải token expired -> logout ngay (token invalid, revoked,...)
    // CHỈ hiển thị modal nếu có token (người dùng đã đăng nhập trước đó)
    if (error.response?.status === 401 && !isTokenExpired && !originalRequest._retry && hasToken) {
      // Endpoint công khai: token cũ hết hạn làm backend trả 401 -> thử lại không kèm token,
      // không logout người dùng (token vẫn dùng được cho các endpoint cần xác thực khác)
      if (isPublicPath(originalRequest.url || '')) {
        originalRequest._retry = true;
        delete originalRequest.headers.Authorization;
        return axiosClient(originalRequest);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { tab: 'login' } }));
      return Promise.reject(error);
    }
    
    if (
      isTokenExpired &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      
      if (isRefreshing) {
        // Nếu đang refresh, đợi trong queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const oldToken = localStorage.getItem('token');
      
      if (!oldToken) {
        // Không có token -> logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        // Gọi refresh token API
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
          { token: oldToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const newToken = response.data.result.token;
        localStorage.setItem('token', newToken);

        // Process queue với token mới
        processQueue(null, newToken);

        // Retry original request với token mới
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại -> logout
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
