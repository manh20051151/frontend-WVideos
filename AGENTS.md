# AGENTS.md - WVideos Frontend

## Commands
```bash
yarn dev      # Chạy dev server (port 3000)
yarn build    # Build production
yarn lint     # Kiểm tra lint
```

## API
- Backend: `http://localhost:8080/api`
- Config: `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8080/api`
- Axios interceptor trong `lib/axios.ts` xử lý JWT tự động

## Quirks
- Axios interceptor trả về `response.data.result` trực tiếp, KHÔNG phải `response.result`
- Sử dụng React Query (`@tanstack/react-query`) cho data fetching
- API calls đặt trong `lib/apis/`

## Skill Files
- `docs/opencode-skill-vietnamese.md` - Comment và log bằng Tiếng Việt

## Code Conventions
- TypeScript, Functional components với hooks
- Tailwind CSS 4 (dùng `@theme` trong CSS)
- API methods trong `lib/apis/` trả về Promise