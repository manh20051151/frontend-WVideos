# Cấu trúc dự án WVideos Frontend

## Tổng quan

Dự án được xây dựng với Next.js 16 App Router, tổ chức theo module và feature-based structure.

## Cấu trúc chi tiết

### `/src/app` - Next.js App Router

```
app/
├── (auth)/              # Auth group routes
│   ├── login/          # Trang đăng nhập
│   └── register/       # Trang đăng ký
├── (main)/             # Main group routes
│   ├── videos/         # Danh sách video
│   ├── upload/         # Upload video
│   └── profile/        # Hồ sơ người dùng
├── admin/              # Admin routes
│   ├── videos/         # Quản lý video
│   ├── users/          # Quản lý người dùng
│   └── dashboard/      # Dashboard
├── layout.tsx          # Root layout
├── page.tsx            # Homepage
└── globals.css         # Global styles
```

### `/src/components` - React Components

```
components/
├── layout/             # Layout components
│   ├── Header.tsx     # Header navigation
│   ├── Footer.tsx     # Footer
│   └── Sidebar.tsx    # Sidebar (if needed)
├── common/            # Reusable components
│   ├── VideoCard.tsx  # Video card component
│   ├── Button.tsx     # Custom button
│   ├── Input.tsx      # Custom input
│   └── Modal.tsx      # Modal component
└── features/          # Feature-specific components
    ├── video/         # Video-related components
    ├── user/          # User-related components
    └── comment/       # Comment components
```

### `/src/lib` - Business Logic

```
lib/
├── apis/              # API calls
│   ├── axiosClient.ts # Axios configuration
│   ├── auth.api.ts    # Auth API
│   ├── video.api.ts   # Video API
│   └── user.api.ts    # User API
├── hooks/             # Custom React hooks
│   ├── useAuth.ts     # Authentication hook
│   ├── useVideo.ts    # Video hook
│   └── useDebounce.ts # Debounce hook
├── utils/             # Utility functions
│   ├── constants.ts   # Constants
│   ├── formatters.ts  # Format functions
│   └── validators.ts  # Validation functions
├── enums/             # TypeScript enums
│   └── videoEnums.ts  # Video-related enums
└── redux/             # Redux store (optional)
    ├── store.ts       # Redux store
    └── slices/        # Redux slices
```

### `/public` - Static Assets

```
public/
├── assets/
│   ├── images/        # Images
│   └── icons/         # Icons
└── favicon.ico        # Favicon
```

## Naming Conventions

### Files
- Components: PascalCase (e.g., `VideoCard.tsx`)
- Utilities: camelCase (e.g., `formatters.ts`)
- API files: camelCase with `.api.ts` suffix (e.g., `video.api.ts`)

### Components
- Use functional components with TypeScript
- Export default for page components
- Named exports for reusable components

### Styling
- Use Tailwind CSS utility classes
- Create custom classes in `globals.css` if needed
- Follow mobile-first approach

## Best Practices

1. **Type Safety**: Sử dụng TypeScript cho tất cả files
2. **Code Splitting**: Sử dụng dynamic imports cho heavy components
3. **Error Handling**: Xử lý errors trong API calls
4. **Loading States**: Hiển thị loading states cho async operations
5. **Responsive Design**: Mobile-first approach với Tailwind breakpoints
6. **Accessibility**: Sử dụng semantic HTML và ARIA labels
7. **Performance**: Optimize images với Next.js Image component
8. **SEO**: Sử dụng Next.js Metadata API

## API Integration

Tất cả API calls được tổ chức trong `/src/lib/apis/`:

```typescript
// Example: video.api.ts
import axiosClient from './axiosClient';

export const videoApi = {
  getAll: (params) => axiosClient.get('/videos', { params }),
  getById: (id) => axiosClient.get(`/videos/${id}`),
  create: (data) => axiosClient.post('/videos', data),
  update: (id, data) => axiosClient.put(`/videos/${id}`, data),
  delete: (id) => axiosClient.delete(`/videos/${id}`),
};
```

## State Management

- **Local State**: useState, useReducer
- **Global State**: Context API hoặc Redux (nếu cần)
- **Server State**: React Query hoặc SWR (có thể thêm sau)

## Routing

Next.js App Router với route groups:

- `(auth)`: Public routes (login, register)
- `(main)`: Protected routes (videos, profile)
- `admin`: Admin-only routes

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Prefix `NEXT_PUBLIC_` để expose biến cho client-side.
