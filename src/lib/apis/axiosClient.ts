import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Axios Request Error:', error);
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

    console.log('❌ Response error:', error.response?.status, error.response?.data);
    
    // Chỉ refresh khi: lỗi 401 + code 5002 (TOKEN_EXPIRED) + chưa retry + không phải request refresh
    const isTokenExpired = error.response?.status === 401 && 
                           error.response?.data?.code === 5002;
    
    console.log('🔍 isTokenExpired:', isTokenExpired, 'status:', error.response?.status, 'code:', error.response?.data?.code);
    
    // Nếu lỗi 401 nhưng KHÔNG phải token expired -> logout ngay (token invalid, revoked,...)
    if (error.response?.status === 401 && !isTokenExpired && !originalRequest._retry) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (
      isTokenExpired &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      console.log('🔄 Token expired detected, isRefreshing=', isRefreshing);
      
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
      console.log('🔄 Calling refresh with token:', oldToken?.substring(0, 20) + '...');
      
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

        console.log('✅ Refresh response:', response.data);
        const newToken = response.data.result.token;
        localStorage.setItem('token', newToken);
        console.log('💾 Token saved to localStorage:', newToken.substring(0, 20) + '...');

        // Process queue với token mới
        processQueue(null, newToken);

        // Retry original request với token mới
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Refresh failed:', refreshError);
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
