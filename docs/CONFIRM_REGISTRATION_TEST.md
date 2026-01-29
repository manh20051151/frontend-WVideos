# Hướng dẫn Test Trang Xác Nhận Đăng Ký

## Tổng quan
Trang xác nhận đăng ký (`/confirm-registration`) được sử dụng để xác thực email của user sau khi đăng ký tài khoản.

## Luồng hoạt động

1. User điền form đăng ký tại trang chủ
2. Backend gửi email xác nhận với link chứa token
3. User click vào link trong email
4. Trang confirm-registration nhận token từ URL và gọi API xác nhận
5. Hiển thị kết quả (thành công/thất bại)
6. Tự động redirect về trang chủ sau 3 giây (nếu thành công)

## Cách test

### 1. Test với đăng ký thật

```bash
# 1. Đảm bảo backend đang chạy
cd WVideos/backendWVideos
mvn spring-boot:run

# 2. Đảm bảo frontend đang chạy
cd WVideos/frontend-wvideos
npm run dev
```

**Các bước:**
1. Mở trình duyệt: http://localhost:3000
2. Click nút "Đăng ký"
3. Điền đầy đủ thông tin:
   - Tên đầy đủ
   - Số điện thoại
   - Email (email thật để nhận được mail)
   - Giới tính
   - Mật khẩu
   - Nhập lại mật khẩu
   - Check "Tôi đồng ý với điều khoản"
4. Click "Đăng ký"
5. Kiểm tra email (có thể trong spam)
6. Click vào link xác nhận trong email
7. Quan sát trang confirm-registration:
   - Loading spinner xuất hiện
   - Sau đó hiển thị thông báo thành công/thất bại
   - Tự động redirect về trang chủ sau 3 giây

### 2. Test với token giả

**Test token không hợp lệ:**
```
http://localhost:3000/confirm-registration?token=invalid-token-123
```
Kết quả mong đợi: Hiển thị lỗi "Token có thể đã hết hạn hoặc không hợp lệ"

**Test không có token:**
```
http://localhost:3000/confirm-registration
```
Kết quả mong đợi: Hiển thị lỗi "Token xác nhận không hợp lệ"

### 3. Test với token thật từ database

Nếu bạn có quyền truy cập database:

```sql
-- Lấy token từ database
SELECT confirmation_token FROM users WHERE email = 'test@example.com';
```

Sau đó test với URL:
```
http://localhost:3000/confirm-registration?token=<token_từ_database>
```

## Các trường hợp test

### ✅ Thành công
- Token hợp lệ và chưa hết hạn
- Hiển thị icon check màu xanh
- Message: "Xác nhận đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ."
- Auto redirect sau 3 giây

### ❌ Thất bại
- Token không hợp lệ
- Token đã hết hạn
- Token đã được sử dụng
- Hiển thị icon X màu đỏ
- Message lỗi từ backend
- Có nút "Về trang chủ" để quay lại

### ⏳ Loading
- Đang gọi API
- Hiển thị spinner xoay tròn
- Message: "Đang xác nhận..."

## Kiểm tra Console

Mở DevTools (F12) và kiểm tra:

**Console tab:**
- Không có lỗi JavaScript
- Có log "Confirmation error:" nếu xác nhận thất bại

**Network tab:**
- Request GET đến `/api/users/confirm?token=...`
- Response status 200 nếu thành công
- Response body chứa `ApiResponse` với code 1000

## Kiểm tra Dark Mode

Trang confirm-registration hỗ trợ dark mode:
- Background: `bg-primary` (dark: #222831, light: #ffffff)
- Card: `bg-secondary` (dark: #393E46, light: #f5f5f5)
- Text: `text-foreground` (dark: #EEEEEE, light: #222831)

Test bằng cách toggle dark mode ở header và reload trang.

## Troubleshooting

### Lỗi CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Giải pháp:** Đảm bảo backend đã cấu hình CORS cho `http://localhost:3000`

### Token hết hạn
Backend có thể set thời gian hết hạn cho token. Kiểm tra config trong `application.yaml`:
```yaml
app:
  confirmation-token-expiration: 86400000 # 24 giờ
```

### Email không gửi được
Kiểm tra cấu hình SMTP trong backend `application.yaml`:
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
```

## API Endpoint

**Endpoint:** `GET /api/users/confirm`

**Query Parameters:**
- `token` (required): Token xác nhận từ email

**Response Success (200):**
```json
{
  "code": 1000,
  "message": "Xác nhận đăng ký thành công",
  "result": {
    "id": "user-id",
    "username": "username",
    "email": "email@example.com",
    "fullName": "Full Name",
    "numberPhone": "0123456789",
    "gender": true,
    "roles": [...]
  }
}
```

**Response Error (400/404):**
```json
{
  "code": 1001,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

## Checklist Test

- [ ] Đăng ký tài khoản mới thành công
- [ ] Nhận được email xác nhận
- [ ] Click link trong email
- [ ] Trang confirm-registration hiển thị loading
- [ ] Hiển thị thông báo thành công
- [ ] Auto redirect về trang chủ sau 3 giây
- [ ] Test với token không hợp lệ → hiển thị lỗi
- [ ] Test không có token → hiển thị lỗi
- [ ] Dark mode hoạt động đúng
- [ ] Responsive trên mobile
- [ ] Không có lỗi trong console

## Notes

- Token chỉ sử dụng được 1 lần
- Token có thời gian hết hạn (mặc định 24h)
- Sau khi xác nhận thành công, user có thể đăng nhập ngay
- Trang sử dụng Suspense boundary để tránh lỗi hydration với `useSearchParams()`
