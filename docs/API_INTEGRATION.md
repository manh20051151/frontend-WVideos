# Hướng dẫn tích hợp API

## Cấu hình Axios Client

File: `src/lib/apis/axiosClient.ts`

```typescript
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý response và errors
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Cấu trúc API Module

Mỗi API module nên có cấu trúc như sau:

```typescript
// src/lib/apis/video.api.ts
import axiosClient from './axiosClient';

export const videoApi = {
  getAll: (params?: any) => {
    return axiosClient.get('/videos', { params });
  },

  getById: (id: string) => {
    return axiosClient.get(`/videos/${id}`);
  },

  create: (data: FormData) => {
    return axiosClient.post('/videos', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  update: (id: string, data: any) => {
    return axiosClient.put(`/videos/${id}`, data);
  },

  delete: (id: string) => {
    return axiosClient.delete(`/videos/${id}`);
  },
};
```

## Sử dụng API trong Components

### Client Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { videoApi } from '@/lib/apis/video.api';

export default function VideoList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await videoApi.getAll();
      setVideos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      {videos.map((video) => (
        <VideoCard key={video.id} {...video} />
      ))}
    </div>
  );
}
```

### Server Component (Next.js 16)

```typescript
import { videoApi } from '@/lib/apis/video.api';

export default async function VideoPage({ params }: { params: { id: string } }) {
  const video = await videoApi.getById(params.id);

  return (
    <div>
      <h1>{video.title}</h1>
      <video src={video.url} controls />
    </div>
  );
}
```

## Error Handling

### Global Error Handler

```typescript
// src/lib/utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return 'Dữ liệu không hợp lệ';
      case 401:
        return 'Vui lòng đăng nhập';
      case 403:
        return 'Bạn không có quyền truy cập';
      case 404:
        return 'Không tìm thấy dữ liệu';
      case 500:
        return 'Lỗi server, vui lòng thử lại sau';
      default:
        return data?.message || 'Có lỗi xảy ra';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Không thể kết nối đến server';
  } else {
    // Something else happened
    return error.message || 'Có lỗi xảy ra';
  }
};
```

### Sử dụng Error Handler

```typescript
try {
  await videoApi.create(formData);
  toast.success('Tải lên thành công!');
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

## Authentication Flow

### Login

```typescript
const handleLogin = async (username: string, password: string) => {
  try {
    const data = await authApi.login({ username, password });
    localStorage.setItem('token', data.token);
    router.push('/');
  } catch (error) {
    setError(handleApiError(error));
  }
};
```

### Protected Routes

```typescript
// src/components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Đang tải...</div>;
  if (!user) return null;

  return <>{children}</>;
}
```

## API Response Format

Backend trả về format:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    // actual data
  }
}
```

Axios interceptor đã xử lý để trả về trực tiếp `data`.

## Best Practices

1. **Luôn xử lý errors**: Sử dụng try-catch cho mọi API calls
2. **Loading states**: Hiển thị loading indicator khi fetch data
3. **Optimistic updates**: Cập nhật UI trước khi API response (nếu phù hợp)
4. **Debounce search**: Sử dụng useDebounce cho search inputs
5. **Cancel requests**: Cancel pending requests khi component unmount
6. **Cache data**: Sử dụng React Query hoặc SWR cho caching (có thể thêm sau)

## Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# .env.production (production)
NEXT_PUBLIC_API_URL=https://api.wvideos.com/api
```

**Lưu ý**: Prefix `NEXT_PUBLIC_` để expose biến cho client-side.
