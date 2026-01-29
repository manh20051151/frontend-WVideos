# Hướng dẫn cài đặt WVideos Frontend

## Yêu cầu hệ thống

- Node.js 20.x trở lên
- Yarn hoặc npm
- Git

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd WVideos/frontend-wvideos
```

### 2. Cài đặt dependencies

```bash
yarn install
# hoặc
npm install
```

### 3. Cấu hình environment variables

Tạo file `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 4. Chạy development server

```bash
yarn dev
# hoặc
npm run dev
```

Mở trình duyệt tại: http://localhost:3000

## Build Production

```bash
# Build
yarn build

# Chạy production server
yarn start
```

## Cấu trúc dự án

Xem chi tiết tại: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## Troubleshooting

### Lỗi cài đặt dependencies

Nếu gặp lỗi EPERM hoặc permission errors:

```bash
# Xóa node_modules và lock files
rm -rf node_modules
rm yarn.lock
# hoặc rm package-lock.json

# Cài đặt lại
yarn install
```

### Lỗi kết nối API

Kiểm tra:
1. Backend đã chạy chưa (port 8080)
2. NEXT_PUBLIC_API_URL trong .env.local đúng chưa
3. CORS đã được cấu hình trên backend chưa

### Lỗi TypeScript

```bash
# Xóa cache TypeScript
rm -rf .next
rm tsconfig.tsbuildinfo

# Build lại
yarn dev
```

## Scripts

- `yarn dev` - Chạy development server
- `yarn build` - Build production
- `yarn start` - Chạy production server
- `yarn lint` - Chạy ESLint

## Git Workflow

Xem chi tiết tại: [Git Flow Guide](../../backendWVideos/docs/guides/GIT_FLOW_GUIDE.md)

## Liên hệ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ team.
