# Fix lỗi đăng nhập thành công nhưng vẫn hiện "Đăng ký, Đăng nhập"

## Vấn đề
Sau khi đăng nhập thành công, Header vẫn hiển thị nút "Đăng ký" và "Đăng nhập" thay vì avatar và menu user.

## Nguyên nhân
1. **AuthModal** sau khi login thành công đang dùng `window.location.reload()` để reload trang
2. Tuy nhiên, trước khi reload, Header component đã render với state cũ (user = null)
3. useAuth hook không tự động cập nhật state sau khi login

## Giải pháp đã áp dụng

### 1. Thêm callback onLoginSuccess vào AuthModal
File: `src/components/auth/AuthModal.tsx`

```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onLoginSuccess?: () => void; // ✅ Thêm callback
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  defaultTab = 'login',
  onLoginSuccess // ✅ Nhận callback
}: AuthModalProps) {
  // ...
  
  // Trong handleSubmit, sau khi login thành công:
  if (response.result?.token) {
    localStorage.setItem('token', response.result.token);
    
    const userInfo = await authApi.getMyInfo();
    if (userInfo.result) {
      localStorage.setItem('user', JSON.stringify(userInfo.result));
    }
    
    setSuccess('Đăng nhập thành công!');
    
    // ✅ Gọi callback để cập nhật state trong Header
    if (onLoginSuccess) {
      onLoginSuccess();
    }
    
    // ✅ Đóng modal sau 500ms (không reload trang)
    setTimeout(() => {
      onClose();
    }, 500);
  }
}
```

### 2. Sửa Header để truyền callback và refresh profile
File: `src/components/layout/Header.tsx`

```typescript
export default function Header() {
  const { user, logout, mounted, refreshProfile } = useAuth(); // ✅ Lấy refreshProfile
  
  // ✅ Tạo callback để refresh profile sau khi login
  const handleLoginSuccess = () => {
    refreshProfile();
  };
  
  return (
    <header>
      {/* ... */}
      
      {/* ✅ Truyền callback vào AuthModal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onLoginSuccess={handleLoginSuccess}
      />
    </header>
  );
}
```

## Flow hoạt động mới

1. User nhập email/password và click "Đăng nhập"
2. AuthModal gọi API login và lưu token vào localStorage
3. AuthModal gọi API getMyInfo và lưu user vào localStorage
4. AuthModal gọi `onLoginSuccess()` callback
5. Header nhận callback và gọi `refreshProfile()`
6. useAuth hook fetch lại profile và cập nhật state `user`
7. Header re-render với user mới → hiển thị avatar và menu
8. AuthModal đóng sau 500ms

## Cách test

### 1. Restart frontend
```bash
cd WVideos/frontend-wvideos
npm run dev
```

### 2. Test đăng nhập
1. Mở http://localhost:3000
2. Click nút "Đăng nhập"
3. Nhập email và password
4. Click "Đăng nhập"
5. Sau khi thấy thông báo "Đăng nhập thành công!", modal sẽ đóng
6. Header sẽ tự động cập nhật hiển thị avatar và menu user

### 3. Kiểm tra localStorage
Mở DevTools → Application → Local Storage → http://localhost:3000

Phải có 2 keys:
- `token`: JWT token
- `user`: JSON object chứa thông tin user

### 4. Kiểm tra Network
Mở DevTools → Network

Sau khi login, phải có 2 requests:
1. `POST /auth/token` → lấy token
2. `GET /users/myInfo` → lấy thông tin user

## Kết quả mong đợi
- ✅ Sau khi đăng nhập thành công, Header hiển thị avatar và menu user
- ✅ Không cần reload trang
- ✅ State được cập nhật tự động
- ✅ Nút "Đăng ký, Đăng nhập" biến mất

## Commit message
```
fix: sửa lỗi Header không cập nhật sau khi đăng nhập

- Thêm callback onLoginSuccess vào AuthModal
- Gọi refreshProfile trong Header sau khi login thành công
- Xóa window.location.reload() để tránh reload trang
- Header tự động re-render khi user state thay đổi
```
