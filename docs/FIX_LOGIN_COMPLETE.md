# Fix hoàn tất: Đăng nhập thành công và hiển thị user state

## Vấn đề ban đầu
Sau khi đăng nhập thành công, Header vẫn hiển thị nút "Đăng ký" và "Đăng nhập" thay vì avatar và menu user.

## Nguyên nhân
**axiosClient response interceptor** đang return toàn bộ Axios response object thay vì `response.data`:

```typescript
// ❌ SAI - Return toàn bộ Axios response
axiosClient.interceptors.response.use(
  (response) => {
    return response; // { data: {...}, status: 200, ... }
  }
);
```

Điều này khiến:
1. Backend trả về: `{ code: 1000, result: { user data } }`
2. axiosClient return: `{ data: { code: 1000, result: {...} }, status: 200, ... }`
3. useAuth check: `response.result` → `undefined` ❌

## Giải pháp

### 1. Sửa axiosClient response interceptor
File: `src/lib/apis/axiosClient.ts`

```typescript
// ✅ ĐÚNG - Return response.data
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // { code: 1000, result: {...} }
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

### 2. Thêm callback onLoginSuccess
File: `src/components/auth/AuthModal.tsx`

```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onLoginSuccess?: () => void; // ✅ Callback để refresh profile
}

// Sau khi login thành công
if (response.result?.token) {
  localStorage.setItem('token', response.result.token);
  
  const userInfo = await authApi.getMyInfo();
  if (userInfo.result) {
    localStorage.setItem('user', JSON.stringify(userInfo.result));
  }
  
  setSuccess('Đăng nhập thành công!');
  
  // ✅ Gọi callback
  if (onLoginSuccess) {
    onLoginSuccess();
  }
  
  setTimeout(() => {
    onClose();
  }, 500);
}
```

### 3. Sửa Header để truyền callback
File: `src/components/layout/Header.tsx`

```typescript
export default function Header() {
  const { user, logout, mounted, refreshProfile } = useAuth();
  
  const handleLoginSuccess = () => {
    refreshProfile(); // ✅ Refresh profile sau khi login
  };
  
  return (
    <header>
      {/* ... */}
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onLoginSuccess={handleLoginSuccess} // ✅ Truyền callback
      />
    </header>
  );
}
```

## Flow hoạt động sau khi fix

1. User nhập email/password và click "Đăng nhập"
2. AuthModal gọi API `POST /auth/token` → nhận token
3. AuthModal gọi API `GET /users/myInfo` → nhận user data
4. AuthModal lưu token và user vào localStorage
5. AuthModal gọi `onLoginSuccess()` callback
6. Header nhận callback và gọi `refreshProfile()`
7. useAuth hook fetch lại profile và cập nhật state `user`
8. Header re-render với user mới → hiển thị avatar và menu ✅
9. AuthModal đóng sau 500ms

## Kết quả

✅ Sau khi đăng nhập, Header tự động hiển thị avatar và menu user
✅ Không cần reload trang
✅ State được cập nhật tự động
✅ Token và user được lưu vào localStorage
✅ Khi reload trang, user vẫn đăng nhập (token còn hợp lệ)

## Console logs khi thành công

```
🔍 useAuth: Checking auth state {hasToken: true, hasSavedUser: false, mounted: true}
🔄 useAuth: Fetching profile...
📦 useAuth: API response: {code: 1000, result: {...}}
✅ useAuth: Profile fetched successfully {id: '...', username: '...', email: '...'}
🎯 useAuth state: {user: 'user@example.com', isAuthenticated: true}
🎨 Header render: {hasUser: true, userEmail: 'user@example.com'}
```

## Files đã sửa

1. `src/lib/apis/axiosClient.ts` - Sửa response interceptor
2. `src/components/auth/AuthModal.tsx` - Thêm callback onLoginSuccess
3. `src/components/layout/Header.tsx` - Truyền callback và gọi refreshProfile
4. `src/lib/hooks/useAuth.ts` - Cải thiện error handling

## Test

1. Mở http://localhost:3000
2. Click "Đăng nhập"
3. Nhập email và password
4. Click "Đăng nhập"
5. Sau 500ms, modal đóng và Header hiển thị avatar ✅
6. Reload trang → vẫn đăng nhập ✅

## Commit message

```
fix: sửa lỗi Header không hiển thị user sau khi đăng nhập

- Sửa axiosClient response interceptor return response.data thay vì response
- Thêm callback onLoginSuccess vào AuthModal để trigger refresh profile
- Header gọi refreshProfile sau khi login thành công
- useAuth tự động cập nhật state và Header re-render
```
