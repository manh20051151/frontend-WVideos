# WVideos Frontend - Steering Rules
# My Rules

- Sử dụng model thiên về code.
- Trả lời, commit code bằng Tiếng Việt.
- Thay "" bằng '' khi commit code lên git.
- Đọc file GIT_FLOW_GUIDE.md trước khi thực hiện các yêu cầu về git
- **LUÔN dùng color từ globals.css** - KHÔNG hardcode màu trực tiếp trong components
1. Sử dụng model thiên về code.
2. Trả lời yêu cầu bằng Tiếng Việt
3. Trả lời, commit code bằng Tiếng Việt (quan trọng).
4. Nội dung Message commit code lên git, hãy sử dụng dấu nháy đơn ' thay vì dấu nháy kép ".
5.  Nội dung Message commit code lên git chỉ liên quan đến những thay đổi thôi. những thay đổi trước đó không cần
6. Một số type phổ biến được khuyên sử dụng bao gồm:

    feat: thêm một feature
    fix: fix bug cho hệ thống
    refactor: sửa code nhưng không fix bug cũng không thêm feature hoặc đôi khi bug cũng được fix từ việc refactor.
    docs: thêm/thay đổi document
    chore: những sửa đổi nhỏ nhặt không liên quan tới code
    style: những thay đổi không làm thay đổi ý nghĩa của code như thay đổi css/ui chẳng hạn.
    perf: code cải tiến về mặt hiệu năng xử lý
    vendor: cập nhật version cho các dependencies, packages.

## Tech Stack
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS 4
- Axios (HTTP client)

## Color System
**QUAN TRỌNG**: Luôn sử dụng CSS variables từ `app/globals.css`, KHÔNG hardcode màu!

### Light Mode Colors
- Primary: `#A8DF8E` (xanh lá nhạt)
- Secondary: `#F0FFDF` (vàng nhạt)
- Accent: `#FFD8DF` (hồng nhạt)
- Highlight: `#FFAAB8` (hồng đậm)

### Dark Mode Colors
- Primary: `#222831` (xám đen)
- Secondary: `#393E46` (xám)
- Accent: `#00ADB5` (xanh cyan)
- Highlight: `#EEEEEE` (trắng xám)

### Cách sử dụng
```tsx
// ✅ ĐÚNG - Dùng CSS variables
<div className='bg-primary text-highlight'>
<button className='border-accent hover:bg-secondary'>

// ❌ SAI - Hardcode màu
<div style={{ backgroundColor: '#A8DF8E' }}>
<button className='bg-[#FFD8DF]'>
```

## Cấu trúc project
```
WVideos/frontend-wvideos/
├── app/
│   ├── globals.css          # CSS variables & Tailwind config
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── src/
│   ├── lib/
│   │   ├── apis/            # API calls (axios)
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   └── enums/           # Enums/constants
│   └── components/
│       ├── common/          # Reusable components
│       ├── features/        # Feature-specific components
│       └── layout/          # Layout components (Header, Footer)
└── docs/                    # Documentation
```

## API Integration
- Base URL: `http://localhost:8080/api`
- Axios client: `src/lib/apis/axiosClient.ts`
- JWT token trong localStorage

## Coding conventions
- Functional components với hooks
- TypeScript với strict mode
- Tailwind CSS cho styling (sử dụng utility classes)
- API calls trong thư mục `src/lib/apis/`
- Custom hooks trong thư mục `src/lib/hooks/`
- Constants trong `src/lib/utils/constants.ts`

## Lưu ý khi code
- Responsive design với Tailwind breakpoints (sm, md, lg, xl)
- Error handling với try-catch và user feedback
- Loading states cho async operations
- Viết comments bằng tiếng Việt khi cần thiết
- Sử dụng 'use client' directive cho client components khi cần
- Tránh hydration mismatch (check typeof window !== 'undefined')
