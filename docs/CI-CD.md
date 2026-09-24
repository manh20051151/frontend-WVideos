# CI/CD Frontend snha

Luồng tự động mỗi khi push lên nhánh `master`:

```
push code → CI lint + build (GitHub) → Docker build + push Docker Hub (GitHub) → deploy trên máy chủ (self-hosted runner)
```

- Pull request chỉ chạy CI (GitHub-hosted), **không** chạy trên máy của bạn → an toàn.
- Job deploy chạy trực tiếp trên máy chủ 24/7 nhờ **self-hosted runner** (không cần SSH).

## 1. File trong repo

| File | Vai trò |
|---|---|
| `Dockerfile` | Image multi-stage: npm ci + `next build` (standalone) → Node 22 Alpine chạy `server.js` |
| `.dockerignore` | Loại `.env`, `node_modules`, `.next` khỏi context build |
| `docker-compose.prod.yml` | Chạy frontend trên máy chủ (port 3000, healthcheck) |
| `.github/workflows/ci-cd.yml` | Workflow GitHub Actions |

## 2. Biến build quan trọng: `NEXT_PUBLIC_API_URL`

Các biến `NEXT_PUBLIC_*` bị nhúng vào bundle client **lúc build**, không phải lúc chạy.
URL API được truyền qua build arg khi Docker build, lấy từ repository variable:

**Repo → Settings → Secrets and variables → Actions → tab Variables → New repository variable**:

| Variable | Giá trị (VD) |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://192.168.2.55:8081/api` |

> Đổi URL API = phải build image mới (workflow tự làm khi bạn push code).

## 3. Cài self-hosted runner trên máy chủ (chạy 1 LẦN)

Máy chủ = máy Windows chạy 24/7 (cần Docker Desktop chạy nền).

1. Vào repo GitHub → **Settings → Actions → Runners → New self-hosted runner → Windows / x64**.
2. Tải + giải nén vào `C:\actions-runner-frontend` (tách riêng với runner backend, hoặc dùng chung runner nếu đã cài — miễn là có label `wvideos`):
   ```powershell
   ./config.cmd --url https://github.com/manh20051151/frontend-WVideos --token <TOKEN> --labels wvideos
   ./svc.cmd install
   ./svc.cmd start
   ```
   Quan trọng: thêm **label `wvideos`**.
3. Kiểm tra: repo → Settings → Actions → Runners thấy runner **Idle**.

> Có thể dùng CHUNG 1 runner cho cả 2 repo (runner đăng ký theo repo, nên mỗi repo cần 1 runner riêng — dùng 2 thư mục khác nhau như trên).

## 4. Cấu hình GitHub Secrets

| Secret | Giá trị |
|---|---|
| `DOCKERHUB_USERNAME` | Tài khoản Docker Hub |
| `DOCKERHUB_TOKEN` | Access token (hub.docker.com → Account Settings → Personal access tokens) |
| `DEPLOY_PATH` | Thư mục deploy trên máy chủ (VD: `E:\deploy\wvideos`) |

## 5. Chuẩn bị thư mục deploy trên máy chủ (chạy 1 lần)

```powershell
mkdir E:\deploy\wvideos\frontend
cd E:\deploy\wvideos\frontend
# Copy docker-compose.prod.yml từ repo vào đây
# Chạy lần đầu:
$env:IMAGE = "manh20051151/wvideos-frontend:latest"
docker compose -f docker-compose.prod.yml up -d
```

## 6. Tạo Docker Hub repo

hub.docker.com → **Create repository** → tên `wvideos-frontend`.

## 7. Kiểm tra

1. Push lên nhánh `master`.
2. Tab **Actions**: 3 job lần lượt Lint & Build → Docker → **Deploy trên máy chủ**.
3. Mở `http://192.168.2.55:3000` — frontend chạy từ container (cần dừng `npm run dev` cũ nếu còn chiếm port 3000).

## Rollback

```powershell
cd E:\deploy\wvideos\frontend
docker pull manh20051151/wvideos-frontend:<ma-sha-cu>
$env:IMAGE = "manh20051151/wvideos-frontend:<ma-sha-cu>"
docker compose -f docker-compose.prod.yml up -d
```
