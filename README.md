# WVideos Frontend

Nền tảng chia sẻ video được xây dựng với Next.js 16, React 19, TypeScript và Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **State Management**: React Hooks + Context API

## Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (main)/            # Main routes (home, videos)
│   ├── admin/             # Admin routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/
│   ├── layout/            # Layout components (Header, Footer)
│   ├── common/            # Reusable components (VideoCard, Button)
│   └── features/          # Feature-specific components
├── lib/
│   ├── apis/              # API calls
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utility functions
│   ├── enums/             # TypeScript enums
│   └── redux/             # Redux store (if needed)
└── public/
    └── assets/            # Static assets
```

## API Integration

- Base URL: `http://localhost:8080/api`
- Backend: Spring Boot (port 8080)
- Authentication: JWT Bearer Token

## Cài đặt

```bash
# Cài đặt dependencies
yarn install

# Chạy development server
yarn dev

# Build production
yarn build

# Chạy production server
yarn start
```

## Environment Variables

Tạo file `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Git Flow

Dự án sử dụng Git Flow workflow:

- `master`: Production branch
- `develop`: Development branch
- `feature/*`: Feature branches
- `release/*`: Release branches
- `hotfix/*`: Hotfix branches

Xem chi tiết tại: [Git Flow Guide](../backendWVideos/docs/guides/GIT_FLOW_GUIDE.md)

## Coding Conventions

- Sử dụng TypeScript cho type safety
- Functional components với hooks
- Tailwind CSS cho styling
- API calls trong thư mục `lib/apis/`
- Custom hooks trong thư mục `lib/hooks/`
- Constants trong `lib/utils/constants.ts`

## Features

- 🎥 Upload và xem video
- 👤 Quản lý người dùng
- 💬 Bình luận và tương tác
- 📊 Dashboard admin
- 🔐 Authentication & Authorization
- 📱 Responsive design

## License

Private
