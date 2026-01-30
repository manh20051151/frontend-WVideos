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
    return Promise.reject(error);
  }
);

// Response interceptor với auto-refresh token
axiosClient.interceptors.response.use(
  (response) => {
    // Return response.data để match với ApiResponse<T> format
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và không phải request refresh token
    if (
      error.response?.status === 401 &&
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
