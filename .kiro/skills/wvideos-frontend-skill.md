---
name: WVideos Frontend Development
description: Skill để làm việc với WVideos Frontend - Next.js 16 App Router với React 19, TypeScript, Tailwind CSS 4
---

# WVideos Frontend Development Skill

## Mục Đích
Skill này hướng dẫn AI làm việc hiệu quả với dự án WVideos Frontend - một web application được xây dựng bằng Next.js 16, React 19, TypeScript, và Tailwind CSS 4, tích hợp với WVideos Backend API.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios 1.13.4
- **State Management**: React Query (@tanstack/react-query 5.90.21)
- **Package Manager**: Yarn

## Cấu Trúc Dự Án

```
frontend-wvideos/
├── app/                        # Next.js App Router
│   ├── admin/                  # Admin dashboard
│   ├── channel/                # User channels
│   ├── login/                  # Authentication
│   ├── upload/                 # Video upload
│   ├── watch/                  # Video player
│   ├── profile/                # User profile
│   ├── wallet/                 # User wallet
│   ├── oauth2/                 # OAuth2 callback
│   ├── confirm-registration/   # Email confirmation
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage
│   └── globals.css             # Global styles
├── src/
│   ├── components/             # React components
│   │   ├── layout/             # Header, Footer
│   │   ├── common/             # Reusable components
│   │   ├── features/           # Feature components
│   │   ├── video/              # Video components
│   │   ├── auth/               # Auth components
│   │   ├── admin/              # Admin components
│   │   └── providers/          # Context providers
│   ├── lib/
│   │   ├── apis/               # API integration (10 files)
│   │   ├── hooks/              # Custom hooks (4 files)
│   │   ├── utils/              # Utilities (5 files)
│   │   └── enums/              # TypeScript enums
│   └── types/                  # TypeScript types (4 files)
├── public/                     # Static assets
└── docs/                       # Documentation
```

## Commands

```bash
# Development
yarn dev      # Start dev server (port 3000)
yarn build    # Build production
yarn start    # Start production server
yarn lint     # Run ESLint
```

## Quy Tắc Khi Code

### 1. Naming Conventions
- **Components**: PascalCase (e.g., `VideoCard`, `UserProfile`)
- **Files**: kebab-case cho pages, PascalCase cho components
- **Functions**: camelCase (e.g., `fetchVideos`, `handleSubmit`)
- **Variables**: camelCase (e.g., `videoId`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_URL`, `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `VideoType`, `UserResponse`)

### 2. Component Structure

#### Client Components
```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function VideoList() {
  const [page, setPage] = useState(0);
  
  const { data, isLoading } = useQuery({
    queryKey: ['videos', page],
    queryFn: () => videoApi.getVideos(page),
  });
  
  if (isLoading) return <LoadingSkeleton />;
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {data?.content.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

#### Server Components (default)
```typescript
// Không cần 'use client'
export default async function VideoPage({ params }: { params: { id: string } }) {
  // Server-side data fetching
  const video = await fetch(`${API_URL}/videos/${params.id}`).then(r => r.json());
  
  return <VideoPlayer video={video} />;
}
```

### 3. API Integration

#### Axios Client Quirks ⚠️
```typescript
// QUAN TRỌNG: Axios interceptor trả về response.data.result trực tiếp
// KHÔNG phải response.result

// ✅ Đúng
const videos = await videoApi.getVideos(); // Trả về Video[]

// ❌ Sai
const videos = await videoApi.getVideos().result; // undefined!
```

#### API Module Pattern
```typescript
// src/lib/apis/video.api.ts
import axiosClient from './axiosClient';
import { VideoResponse, VideoUploadRequest } from '@/types';

const videoApi = {
  // Get videos với pagination
  getVideos: async (page: number = 0, size: number = 10): Promise<Page<VideoResponse>> => {
    return axiosClient.get(`/videos/public?page=${page}&size=${size}`);
  },
  
  // Upload video
  uploadVideo: async (request: VideoUploadRequest): Promise<VideoResponse> => {
    return axiosClient.post('/videos/upload', request);
  },
};

export default videoApi;
```

### 4. React Query Pattern

```typescript
// Prefetching
useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['videos', 0],
    queryFn: () => videoApi.getVideos(0),
  });
}, [queryClient]);

// Query với caching
const { data, isLoading, error } = useQuery({
  queryKey: ['videos', page, sortBy],
  queryFn: () => videoApi.getVideos(page, 10, sortBy),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes
});

// Mutation
const mutation = useMutation({
  mutationFn: videoApi.uploadVideo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['videos'] });
  },
});
```

### 5. Custom Hooks

```typescript
// src/lib/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };
  
  return { user, token, login, logout, isAuthenticated: !!token };
};
```

### 6. Styling với Tailwind CSS 4

#### Theme Variables
```css
/* app/globals.css */
@theme {
  --color-primary: #0f172a;
  --color-secondary: #1e293b;
  --color-accent: #3b82f6;
  --color-foreground: #f8fafc;
}
```

#### Component Styling
```typescript
// Responsive + Dark mode
<div className="
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
  bg-primary dark:bg-gray-900
  text-foreground dark:text-gray-100
  p-4 rounded-xl
  hover:shadow-xl transition-all
">
  {/* Content */}
</div>
```

### 7. TypeScript Types

```typescript
// src/types/video.types.ts
export interface VideoResponse {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  splashImageUrl?: string;
  fileCode: string;
  duration: number;
  views: number;
  favoritesCount: number;
  commentsCount: number;
  status: VideoStatus;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatar?: string;
  };
}

export enum VideoStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
```

### 8. Error Handling

```typescript
// API error handling
try {
  const video = await videoApi.getVideo(id);
  return video;
} catch (error: any) {
  if (error.response?.status === 404) {
    console.error('Video không tồn tại');
  } else if (error.response?.status === 401) {
    console.error('Chưa đăng nhập');
    router.push('/login');
  } else {
    console.error('Lỗi:', error.message);
  }
  throw error;
}
```

### 9. Loading States

```typescript
// Skeleton loading
const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden bg-gray-800 animate-pulse">
    <div className="aspect-video bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-700 rounded w-1/2" />
    </div>
  </div>
);

// Usage
{isLoading ? (
  <div className="grid grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
  </div>
) : (
  <VideoGrid videos={data?.content} />
)}
```

### 10. Comment Bằng Tiếng Việt

```typescript
// Lấy danh sách video từ API
const fetchVideos = async () => {
  try {
    // Gọi API với pagination
    const response = await videoApi.getVideos(page, size);
    
    // Cập nhật state
    setVideos(response.content);
    setTotalPages(response.totalPages);
  } catch (error) {
    console.error('Lỗi khi lấy videos:', error);
  }
};
```

## Key Features Implementation

### 1. Authentication Flow

```typescript
// Login
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authApi.login({ email, password });
    
    // Lưu token và user info
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirect
    router.push('/');
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Auto token refresh (handled by axios interceptor)
// Khi token expired (code 5002), tự động refresh và retry request
```

### 2. Video Upload Flow

```typescript
// 2-step upload process
const handleUpload = async (file: File, metadata: VideoMetadata) => {
  // Step 1: Init upload
  const initResponse = await videoApi.initUpload({
    title: metadata.title,
    description: metadata.description,
  });
  
  const { videoId, uploadUrl } = initResponse;
  
  // Step 2: Upload to DoodStream
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', DOODSTREAM_API_KEY);
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });
  
  const { filecode } = await uploadResponse.json();
  
  // Step 3: Complete upload
  await videoApi.completeUpload(videoId, filecode);
};
```

### 3. Dark Mode

```typescript
// src/lib/hooks/useDarkMode.ts
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    setIsDark(stored === 'true');
  }, []);
  
  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('darkMode', String(newValue));
    
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return { isDark, toggle };
};
```

### 4. Pagination

```typescript
const [page, setPage] = useState(0);

const { data } = useQuery({
  queryKey: ['videos', page],
  queryFn: () => videoApi.getVideos(page, 10),
});

// Pagination UI
<div className="flex gap-2">
  <button 
    onClick={() => setPage(p => Math.max(0, p - 1))}
    disabled={page === 0}
  >
    Previous
  </button>
  
  {[...Array(data?.totalPages)].map((_, i) => (
    <button
      key={i}
      onClick={() => setPage(i)}
      className={page === i ? 'bg-accent text-white' : 'bg-gray-200'}
    >
      {i + 1}
    </button>
  ))}
  
  <button
    onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
    disabled={page >= data.totalPages - 1}
  >
    Next
  </button>
</div>
```

## Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Axios Client Config
```typescript
// src/lib/apis/axiosClient.ts
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Auto inject JWT
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Auto refresh token
axiosClient.interceptors.response.use(
  (response) => response.data?.result ?? response.data,
  async (error) => {
    // Handle 401 + code 5002 (TOKEN_EXPIRED)
    // Auto refresh và retry request
  }
);
```

## Common Tasks

### Thêm Page Mới
1. Tạo folder trong `app/` (e.g., `app/videos/`)
2. Tạo `page.tsx` với default export
3. Add metadata nếu cần (SEO)
4. Implement UI với Tailwind CSS

### Thêm Component Mới
1. Tạo file trong `src/components/` với PascalCase
2. Export default component
3. Add TypeScript props interface
4. Implement với Tailwind CSS
5. Add to index.ts nếu cần export

### Thêm API Module Mới
1. Tạo file trong `src/lib/apis/` (e.g., `comment.api.ts`)
2. Import axiosClient
3. Define API methods
4. Export default object
5. Add to `src/lib/apis/index.ts`

### Thêm Custom Hook Mới
1. Tạo file trong `src/lib/hooks/` với prefix `use`
2. Implement hook logic
3. Export hook function
4. Add to `src/lib/hooks/index.ts`

## Best Practices

✅ Sử dụng TypeScript cho type safety
✅ Client components với `'use client'` directive
✅ React Query cho data fetching & caching
✅ Custom hooks cho reusable logic
✅ Tailwind CSS cho styling (không inline styles)
✅ Responsive design (mobile-first)
✅ Dark mode support
✅ Loading states với skeleton
✅ Error boundaries
✅ SEO optimization với metadata
✅ Comment bằng Tiếng Việt
✅ Accessibility (a11y) compliance

## Git Commit Messages

Sử dụng conventional commits với Tiếng Việt:

```bash
feat: thêm trang upload video
fix: sửa lỗi hiển thị thumbnail
refactor: cải thiện video card component
style: cập nhật dark mode colors
perf: tối ưu loading performance
docs: cập nhật README
```

## Troubleshooting

### Issue: Axios trả về undefined
- ⚠️ Nhớ rằng interceptor trả về `response.data.result`
- Không cần `.result` khi gọi API

### Issue: Token không tự động refresh
- Check error response có code 5002 không
- Verify refresh endpoint hoạt động
- Check localStorage có token không

### Issue: Dark mode không persist
- Check localStorage.getItem('darkMode')
- Verify useEffect dependency array
- Check document.documentElement.classList

### Issue: React Query không cache
- Check queryKey có unique không
- Verify staleTime và gcTime
- Check queryClient configuration

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS 4 Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Project README](../README.md)
- [Backend API Docs](http://localhost:8080/swagger-ui.html)
