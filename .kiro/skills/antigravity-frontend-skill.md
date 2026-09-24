---
name: Antigravity - snha Frontend
description: Skill tối ưu cho Antigravity IDE khi làm việc với snha Frontend Next.js 16 + React 19 project
---

# Antigravity IDE - snha Frontend Skill

## Mục Đích
Skill này tối ưu hóa cách Antigravity AI làm việc với snha Frontend, bao gồm component generation, React hooks, API integration, styling với Tailwind CSS 4, và TypeScript best practices.

## Project Context

**Type**: Next.js 16 App Router Application
**Language**: TypeScript 5
**UI Library**: React 19.2.3
**Styling**: Tailwind CSS 4
**State Management**: React Query + React Hooks
**HTTP Client**: Axios với custom interceptors

## Antigravity Workflow

### 1. Component Generation

#### Tạo Page Component
```typescript
// Prompt: "Tạo page /videos với video grid và pagination"
// Antigravity sẽ generate:

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import videoApi from '@/lib/apis/video.api';
import VideoCard from '@/components/video/VideoCard';
import Pagination from '@/components/common/Pagination';

export default function VideosPage() {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  
  const { data, isLoading } = useQuery({
    queryKey: ['videos', page, sortBy],
    queryFn: () => videoApi.getVideos(page, 12, sortBy),
    staleTime: 5 * 60 * 1000,
  });
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Videos</h1>
      
      {/* Sort options */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('newest')}
          className={`px-4 py-2 rounded-lg ${
            sortBy === 'newest' ? 'bg-accent text-white' : 'bg-gray-200'
          }`}
        >
          Mới nhất
        </button>
        <button
          onClick={() => setSortBy('popular')}
          className={`px-4 py-2 rounded-lg ${
            sortBy === 'popular' ? 'bg-accent text-white' : 'bg-gray-200'
          }`}
        >
          Phổ biến
        </button>
      </div>
      
      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.content.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={data?.totalPages || 0}
        onPageChange={setPage}
      />
    </div>
  );
}
```

#### Tạo Reusable Component
```typescript
// Prompt: "Tạo VideoCard component với thumbnail, title, views"
// Antigravity sẽ generate:

import Link from 'next/link';
import Image from 'next/image';
import { VideoResponse } from '@/types/video.types';

interface VideoCardProps {
  video: VideoResponse;
}

export default function VideoCard({ video }: VideoCardProps) {
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <Image
            src={video.thumbnailUrl || '/placeholder.jpg'}
            alt={video.title}
            fill
            className="object-cover"
          />
          
          {/* Duration badge */}
          {video.duration > 0 && (
            <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        
        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-accent transition-colors">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between text-sm text-foreground/60">
            <span>{formatViews(video.views)} lượt xem</span>
            <span>{video.user.fullName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### 2. Custom Hook Generation

```typescript
// Prompt: "Tạo useVideoUpload hook với progress tracking"
// Antigravity sẽ generate:

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import videoApi from '@/lib/apis/video.api';

interface UploadProgress {
  percent: number;
  stage: 'init' | 'uploading' | 'completing' | 'done';
}

export const useVideoUpload = () => {
  const [progress, setProgress] = useState<UploadProgress>({
    percent: 0,
    stage: 'init',
  });
  const queryClient = useQueryClient();
  
  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: any }) => {
      // Step 1: Init upload
      setProgress({ percent: 10, stage: 'init' });
      const initResponse = await videoApi.initUpload(metadata);
      
      // Step 2: Upload to DoodStream
      setProgress({ percent: 30, stage: 'uploading' });
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch(initResponse.uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      const { filecode } = await uploadResponse.json();
      setProgress({ percent: 80, stage: 'completing' });
      
      // Step 3: Complete upload
      const result = await videoApi.completeUpload(initResponse.videoId, filecode);
      setProgress({ percent: 100, stage: 'done' });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
  
  return {
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    progress,
    error: uploadMutation.error,
  };
};
```

### 3. API Integration

```typescript
// Prompt: "Thêm API method để get video comments"
// Antigravity sẽ generate trong src/lib/apis/video.api.ts:

const videoApi = {
  // ... existing methods
  
  // Get video comments với pagination
  getVideoComments: async (
    videoId: string,
    page: number = 0,
    size: number = 10
  ): Promise<Page<CommentResponse>> => {
    return axiosClient.get(`/videos/${videoId}/comments?page=${page}&size=${size}`);
  },
  
  // Add comment
  addComment: async (videoId: string, content: string): Promise<CommentResponse> => {
    return axiosClient.post(`/videos/${videoId}/comments`, { content });
  },
  
  // Delete comment
  deleteComment: async (videoId: string, commentId: string): Promise<void> => {
    return axiosClient.delete(`/videos/${videoId}/comments/${commentId}`);
  },
};
```

### 4. Styling với Tailwind CSS 4

```typescript
// Prompt: "Style VideoCard với dark mode và hover effects"
// Antigravity sẽ generate:

<div className="
  rounded-xl overflow-hidden
  bg-white dark:bg-gray-800
  shadow-lg hover:shadow-xl
  transition-all duration-300
  hover:-translate-y-1
  group
">
  <div className="relative aspect-video">
    <Image
      src={video.thumbnailUrl}
      alt={video.title}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-300"
    />
  </div>
  
  <div className="p-4">
    <h3 className="
      font-semibold text-lg
      text-gray-900 dark:text-gray-100
      line-clamp-2
      group-hover:text-blue-600 dark:group-hover:text-blue-400
      transition-colors
    ">
      {video.title}
    </h3>
  </div>
</div>
```

### 5. TypeScript Type Generation

```typescript
// Prompt: "Tạo types cho Comment feature"
// Antigravity sẽ generate trong src/types/comment.types.ts:

export interface CommentResponse {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  video: {
    id: string;
    title: string;
  };
}

export interface CommentRequest {
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export type CommentSortBy = 'newest' | 'oldest' | 'popular';
```

## Antigravity Commands

### Quick Actions

```bash
# Component generation
/generate page videos
/generate component VideoCard
/generate hook useVideoUpload
/generate api video.api

# Styling
/style component VideoCard
/style dark-mode VideoCard
/style responsive VideoCard

# TypeScript
/type generate CommentResponse
/type check VideoCard
/type fix errors

# Testing
/test generate VideoCard.test
/test run VideoCard.test
```

### Code Analysis

```bash
# Performance
/analyze performance HomePage
/analyze bundle-size
/analyze lighthouse

# Accessibility
/analyze a11y VideoCard
/analyze contrast colors
/analyze keyboard-nav

# SEO
/analyze seo HomePage
/analyze meta-tags
```

## Antigravity Best Practices

### 1. React 19 Patterns

```typescript
// Use 'use client' cho client components
'use client';

import { useState, useEffect } from 'react';

// Server components (default) - không cần 'use client'
export default async function VideoPage({ params }: { params: { id: string } }) {
  const video = await fetch(`${API_URL}/videos/${params.id}`).then(r => r.json());
  return <VideoPlayer video={video} />;
}
```

### 2. React Query Patterns

```typescript
// Antigravity sẽ suggest optimal caching strategy
const { data, isLoading } = useQuery({
  queryKey: ['videos', page, sortBy],
  queryFn: () => videoApi.getVideos(page, 10, sortBy),
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 10 * 60 * 1000,         // 10 minutes
  refetchOnWindowFocus: false,
});
```

### 3. Axios Interceptor Awareness

```typescript
// ⚠️ Antigravity sẽ nhắc nhở:
// Axios interceptor trả về response.data.result trực tiếp

// ✅ Correct
const videos = await videoApi.getVideos();
// videos là Video[] trực tiếp

// ❌ Wrong
const videos = await videoApi.getVideos().result;
// undefined!
```

### 4. Type Safety

```typescript
// Antigravity ensure type safety
interface VideoCardProps {
  video: VideoResponse;  // Type-safe
  onLike?: (id: string) => void;  // Optional callback
}

export default function VideoCard({ video, onLike }: VideoCardProps) {
  // TypeScript autocomplete works perfectly
  return <div>{video.title}</div>;
}
```

## Antigravity Shortcuts

### Navigation
- `Ctrl+P` - Quick file search
- `Ctrl+Shift+F` - Global search
- `Ctrl+Click` - Go to definition
- `Alt+Left/Right` - Navigate back/forward

### Editing
- `Alt+Shift+F` - Format document
- `Ctrl+Space` - Trigger autocomplete
- `Ctrl+.` - Quick fix
- `F2` - Rename symbol

### Refactoring
- `Ctrl+Shift+R` - Refactor
- Extract component
- Extract hook
- Rename component

## Antigravity Integration

### Git Integration
```bash
# Smart commits
/git commit "feat: thêm video comments feature"
/git commit "fix: sửa lỗi dark mode toggle"
/git commit "style: cải thiện responsive layout"

# Branch workflow
/git branch feature/comments
/git checkout develop
/git merge feature/comments --no-ff
```

### Package Management
```bash
# Dependencies
/yarn add @tanstack/react-query
/yarn add -D @types/node
/yarn remove unused-package

# Scripts
/yarn dev
/yarn build
/yarn lint
```

### Preview & Testing
```bash
# Dev server
/dev start
/dev restart
/dev stop

# Build & preview
/build production
/preview build

# Testing
/test run all
/test watch VideoCard
```

## Antigravity AI Prompts

### Effective Prompts

✅ **Good Prompts**:
- "Tạo VideoCard component với thumbnail hover effect và dark mode"
- "Thêm useVideoUpload hook với progress tracking"
- "Refactor HomePage để tách video grid thành component riêng"
- "Fix TypeScript error trong VideoCard props"
- "Tối ưu performance cho video list với React Query"

❌ **Bad Prompts**:
- "Make it pretty" (không cụ thể)
- "Fix bug" (thiếu context)
- "Add feature" (quá chung chung)

### Context-Rich Prompts

```
"Trong VideoCard component, thêm hover effect để:
- Scale thumbnail lên 105% khi hover
- Hiển thị play button overlay
- Thay đổi title color thành accent color
- Smooth transition 300ms
- Support dark mode"
```

## Debugging với Antigravity

### Common Issues

#### Issue: Hydration Error
```bash
/debug hydration-error
# Antigravity sẽ:
# - Check client/server mismatch
# - Identify useEffect issues
# - Suggest fixes
```

#### Issue: Axios returns undefined
```bash
/debug axios-undefined VideoCard
# Antigravity nhắc nhở:
# ⚠️ Axios interceptor trả về response.data.result
# Không cần .result khi gọi API
```

#### Issue: Dark mode không persist
```bash
/debug dark-mode-persist
# Antigravity sẽ check:
# - localStorage implementation
# - useEffect dependencies
# - document.documentElement.classList
```

#### Issue: React Query không cache
```bash
/debug react-query-cache
# Antigravity sẽ check:
# - queryKey uniqueness
# - staleTime configuration
# - QueryClient setup
```

## Performance Optimization

### Antigravity Suggestions

```typescript
// 1. Image optimization
import Image from 'next/image';

<Image
  src={video.thumbnailUrl}
  alt={video.title}
  width={320}
  height={180}
  loading="lazy"
  placeholder="blur"
/>

// 2. Code splitting
const VideoPlayer = dynamic(() => import('@/components/video/VideoPlayer'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});

// 3. Memoization
const VideoCard = memo(({ video }: VideoCardProps) => {
  // Component logic
});

// 4. Virtual scrolling cho long lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

## Accessibility (a11y)

### Antigravity A11y Checks

```typescript
// Antigravity sẽ suggest:

// 1. Semantic HTML
<button type="button" aria-label="Play video">
  <PlayIcon />
</button>

// 2. Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>

// 3. ARIA labels
<input
  type="text"
  aria-label="Search videos"
  placeholder="Search..."
/>

// 4. Focus management
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

## SEO Optimization

### Antigravity SEO Suggestions

```typescript
// app/videos/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const video = await fetch(`${API_URL}/videos/${params.id}`).then(r => r.json());
  
  return {
    title: video.title,
    description: video.description,
    openGraph: {
      title: video.title,
      description: video.description,
      images: [video.thumbnailUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description: video.description,
      images: [video.thumbnailUrl],
    },
  };
}
```

## Troubleshooting

### Build Issues
```bash
/analyze build-error
# Check:
# - TypeScript errors
# - Missing dependencies
# - Environment variables
# - Next.js config
```

### Runtime Issues
```bash
/debug runtime-error HomePage
# Analyze:
# - Console errors
# - Network requests
# - State management
# - Component lifecycle
```

### Performance Issues
```bash
/analyze performance
# Check:
# - Bundle size
# - Render performance
# - Network waterfall
# - Core Web Vitals
```

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS 4 Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Project README](../README.md)
