---
name: WVideos Frontend Development
description: Skill để làm việc với WVideos Frontend - Next.js 16 App Router với React 19, TypeScript, Tailwind CSS 4
---

# WVideos Frontend Development Skill

## Mục Đích
Skill này hướng dẫn AI làm việc hiệu quả với dự án WVideos Frontend - một web application được xây dựng bằng Next.js 16, React 19, TypeScript, và Tailwind CSS 4, tích hợp với WVideos Backend API.

## Project Path
**Frontend**: `e:\project\WVideos\frontend-wvideos`
**Backend**: `e:\project\WVideos\backendWVideos`

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
│   │   └── admin/              # Admin components
│   ├── lib/
│   │   ├── apis/               # API integration (10 files)
│   │   ├── hooks/              # Custom hooks (4 files)
│   │   ├── utils/              # Utilities (5 files)
│   │   └── enums/              # TypeScript enums
│   └── types/                  # TypeScript types (4 files)
└── public/                     # Static assets
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
    staleTime: 5 * 60 * 1000,
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

### 3. API Integration - QUAN TRỌNG ⚠️

**Axios Interceptor Quirk**:
```typescript
// ⚠️ QUAN TRỌNG: Axios interceptor trả về response.data.result trực tiếp
// KHÔNG phải response.result

// ✅ Đúng
const videos = await videoApi.getVideos(); // Trả về Video[]

// ❌ Sai
const videos = await videoApi.getVideos().result; // undefined!
```

### 4. React Query Pattern

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['videos', page, sortBy],
  queryFn: () => videoApi.getVideos(page, 10, sortBy),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes
});
```

### 5. Styling với Tailwind CSS 4

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

### 6. TypeScript Types

```typescript
// src/types/video.types.ts
export interface VideoResponse {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;
  views: number;
  status: VideoStatus;
  isPublic: boolean;
  createdAt: string;
}

export enum VideoStatus {
  UPLOADING = 'UPLOADING',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}
```

### 7. Comment Bằng Tiếng Việt

```typescript
// Lấy danh sách video từ API
const fetchVideos = async () => {
  try {
    // Gọi API với pagination
    const response = await videoApi.getVideos(page, size);
    
    // Cập nhật state
    setVideos(response.content);
  } catch (error) {
    console.error('Lỗi khi lấy videos:', error);
  }
};
```

## Key Features Implementation

### 1. Authentication Flow

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authApi.login({ email, password });
    
    // Lưu token và user info
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    router.push('/');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 2. Video Upload Flow (2-step)

```typescript
const handleUpload = async (file: File, metadata: VideoMetadata) => {
  // Step 1: Init upload
  const initResponse = await videoApi.initUpload({
    title: metadata.title,
    description: metadata.description,
  });
  
  // Step 2: Upload to DoodStream
  const formData = new FormData();
  formData.append('file', file);
  
  await fetch(initResponse.uploadUrl, {
    method: 'POST',
    body: formData,
  });
  
  // Step 3: Complete upload
  await videoApi.completeUpload(initResponse.videoId, filecode);
};
```

### 3. Dark Mode

```typescript
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  
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

## Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Axios Client
```typescript
// src/lib/apis/axiosClient.ts
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Auto inject JWT
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto refresh token khi expired (code 5002)
axiosClient.interceptors.response.use(
  (response) => response.data?.result ?? response.data,
  async (error) => {
    // Handle token refresh
  }
);
```

## Common Tasks

### Thêm Page Mới
1. Tạo folder trong `app/` (e.g., `app/videos/`)
2. Tạo `page.tsx` với default export
3. Implement UI với Tailwind CSS

### Thêm Component Mới
1. Tạo file trong `src/components/` với PascalCase
2. Export default component
3. Add TypeScript props interface
4. Style với Tailwind CSS

### Thêm API Module
1. Tạo file trong `src/lib/apis/` (e.g., `comment.api.ts`)
2. Import axiosClient
3. Define API methods
4. Export default object

### Thêm Custom Hook
1. Tạo file trong `src/lib/hooks/` với prefix `use`
2. Implement hook logic
3. Export hook function

## Best Practices

✅ Sử dụng TypeScript cho type safety
✅ Client components với `'use client'` directive
✅ React Query cho data fetching & caching
✅ Custom hooks cho reusable logic
✅ Tailwind CSS cho styling
✅ Responsive design (mobile-first)
✅ Dark mode support
✅ Loading states với skeleton
✅ Comment bằng Tiếng Việt
✅ Accessibility compliance

## Troubleshooting

### Issue: Axios trả về undefined
⚠️ Nhớ rằng interceptor trả về `response.data.result` trực tiếp
Không cần `.result` khi gọi API

### Issue: Token không tự động refresh
- Check error response có code 5002 không
- Verify refresh endpoint hoạt động

### Issue: Dark mode không persist
- Check localStorage.getItem('darkMode')
- Verify useEffect dependencies

### Issue: React Query không cache
- Check queryKey có unique không
- Verify staleTime và gcTime

## Git Commit Messages

```bash
feat: thêm trang upload video
fix: sửa lỗi hiển thị thumbnail
refactor: cải thiện video card component
style: cập nhật dark mode colors
perf: tối ưu loading performance
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Backend API](http://localhost:8080/swagger-ui.html)
