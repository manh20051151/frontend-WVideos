# Test AuthModal Component

## Vấn đề đã sửa
- **Lỗi**: Click "Đăng ký" trên header nhưng hiện popup đăng nhập
- **Nguyên nhân**: 
  1. Thứ tự tab trong array `['register', 'login']` không khớp với logic
  2. State `activeTab` không cập nhật khi `defaultTab` thay đổi

## Giải pháp đã áp dụng

### 1. Thêm useEffect để cập nhật activeTab
```tsx
useEffect(() => {
  if (isOpen) {
    setActiveTab(defaultTab);
    setSuccessMessage('');
  }
}, [defaultTab, isOpen]);
```

### 2. Sửa thứ tự tab
```tsx
// Trước: ['register', 'login'] 
// Sau: ['login', 'register']
{(['login', 'register'] as AuthTab[]).map((tab) => (
```

## Test Cases

### Test 1: Click "Đăng ký" trên header
1. Click nút "Đăng ký" trên header
2. **Kỳ vọng**: Modal mở với tab "Đăng ký" được active
3. **Kiểm tra**: Tab "Đăng ký" có border-accent và text-accent

### Test 2: Click "Đăng nhập" trên header  
1. Click nút "Đăng nhập" trên header
2. **Kỳ vọng**: Modal mở với tab "Đăng nhập" được active
3. **Kiểm tra**: Tab "Đăng nhập" có border-accent và text-accent

### Test 3: Chuyển đổi tab trong modal
1. Mở modal với tab "Đăng nhập"
2. Click tab "Đăng ký"
3. **Kỳ vọng**: Chuyển sang form đăng ký
4. **Kiểm tra**: Form RegisterForm được hiển thị

### Test 4: Đóng và mở lại modal
1. Mở modal với tab "Đăng ký"
2. Đóng modal
3. Mở lại modal với tab "Đăng nhập"
4. **Kỳ vọng**: Modal mở với tab "Đăng nhập" được active
5. **Kiểm tra**: useEffect đã reset activeTab đúng

## Cách test thủ công

1. **Khởi động dev server**:
   ```bash
   npm run dev
   ```

2. **Test trên browser**:
   - Mở http://localhost:3000
   - Click "Đăng ký" → Kiểm tra tab "Đăng ký" active
   - Đóng modal
   - Click "Đăng nhập" → Kiểm tra tab "Đăng nhập" active
   - Chuyển đổi giữa các tab trong modal

3. **Kiểm tra responsive**:
   - Test trên mobile (toggle mobile menu)
   - Test trên tablet và desktop

## Kết quả mong đợi
- ✅ Click "Đăng ký" → Hiện form đăng ký
- ✅ Click "Đăng nhập" → Hiện form đăng nhập  
- ✅ Chuyển đổi tab hoạt động mượt mà
- ✅ Modal reset đúng state khi đóng/mở lại