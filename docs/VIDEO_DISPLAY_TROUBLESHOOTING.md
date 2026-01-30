# Troubleshooting: Video không hiển thị thông tin

## Vấn đề

Video cards hiển thị nhưng:
- ❌ Thumbnail màu đen (không có ảnh)
- ❌ Title hiển thị test data ("dfdfd")
- ❌ Views = 0
- ❌ Không có thông tin chi tiết

## Lưu ý về Thumbnail

**Hệ thống sử dụng Splash Image làm thumbnail chính**:
- **Ưu tiên 1**: `splashImageUrl` - ảnh splash có chất lượng cao, kích thước lớn
- **Ưu tiên 2**: `thumbnailUrl` - ảnh thumbnail nhỏ hơn (fallback)
- **Ưu tiên 3**: Placeholder - nếu cả 2 đều null

DoodStream cung cấp 3 loại ảnh:
- `splash_img`: Ảnh splash (1280x720) - **đang dùng**
- `single_img`: Ảnh thumbnail (640x360)
- `thumb_img`: Ảnh thumbnail nhỏ (160x90)

## Nguyên nhân

### 1. DoodStream chưa tạo thumbnail

DoodStream cần thời gian để process video sau khi upload:
- **Upload xong**: Video có status `UPLOADING` hoặc `PROCESSING`
- **Processing**: DoodStream đang tạo thumbnails, encode video
- **Ready**: Video sẵn sàng, thumbnails đã có

**Thời gian xử lý**: 1-5 phút tùy kích thước video

### 2. Database chưa có thông tin mới nhất

Sau khi DoodStream xử lý xong, cần sync để cập nhật:
- Thumbnail URLs
- Views count
- Video status
- File size, duration

## Giải pháp

### Bước 1: Kiểm tra console browser

Mở DevTools (F12) và xem console:

```javascript
// Khi load trang my-videos
📹 Videos response: {
  content: [
    {
      id: "uuid",
      title: "dfdfd",
      thumbnailUrl: null,  // ← Vấn đề ở đây
      status: "PROCESSING",
      views: 0
    }
  ]
}
```

### Bước 2: Click nút 🔄 Refresh

Mỗi video card có nút 🔄 (màu xanh lá):
1. Click nút 🔄
2. Đợi API call hoàn tất (nút hiển thị ⏳)
3. Xem alert hiển thị thông tin mới

**Alert sẽ hiển thị**:
```
✅ Đã cập nhật thông tin video!

Views: 123
Status: READY
Thumbnail: Có
```

### Bước 3: Kiểm tra backend logs

Nếu sync thất bại, kiểm tra backend console:

```
🔄 User xxx đang sync thông tin video: yyy
📦 DoodStream response: {...}
✅ Sync thông tin video thành công: 123 views
```

Hoặc lỗi:
```
❌ Lỗi khi lấy thông tin file: Invalid file_code
```

### Bước 4: Test trực tiếp DoodStream API

Dùng PowerShell script:

```powershell
# WVideos/backendWVideos/test-sync-video.ps1
$VIDEO_ID = "your-video-id"
$TOKEN = "your-jwt-token"

# Sync video
Invoke-RestMethod `
    -Uri "http://localhost:8080/api/videos/$VIDEO_ID/sync" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $TOKEN" }
```

## Debug Steps

### 1. Kiểm tra video trong database

```sql
USE db_wvideos;

SELECT 
    id,
    title,
    file_code,
    thumbnail_url,
    status,
    views,
    created_at
FROM videos
ORDER BY created_at DESC
LIMIT 5;
```

**Kết quả mong đợi**:
- `file_code`: có giá trị (vd: "abc123xyz")
- `thumbnail_url`: NULL hoặc có URL
- `status`: UPLOADING/PROCESSING/READY

### 2. Test DoodStream API trực tiếp

```bash
# Lấy thông tin file
curl "https://doodapi.co/api/file/info?key=YOUR_API_KEY&file_code=abc123xyz"
```

**Response mong đợi**:
```json
{
  "status": 200,
  "result": [
    {
      "filecode": "abc123xyz",
      "status": 200,
      "canplay": 1,
      "views": "0",
      "single_img": "https://img.doodcdn.io/snaps/xxx.jpg",
      "splash_img": "https://img.doodcdn.io/splash/xxx.jpg"
    }
  ]
}
```

### 3. Kiểm tra API response trong browser

DevTools → Network → XHR:
1. Reload trang my-videos
2. Tìm request `my-videos?page=0&size=12`
3. Xem Response tab

**Response structure**:
```json
{
  "code": 1000,
  "result": {
    "content": [
      {
        "id": "uuid",
        "title": "Video title",
        "thumbnailUrl": "https://...",
        "status": "READY"
      }
    ]
  }
}
```

## Common Issues

### Issue 1: thumbnailUrl = null

**Nguyên nhân**: DoodStream chưa tạo thumbnail

**Giải pháp**:
1. Đợi 2-3 phút
2. Click nút 🔄 Refresh
3. Nếu vẫn null, check DoodStream API trực tiếp

### Issue 2: Status = PROCESSING

**Nguyên nhân**: Video đang được xử lý

**Giải pháp**:
- Đợi DoodStream xử lý xong
- Thời gian: 1-5 phút
- Click 🔄 để check status

### Issue 3: Sync API trả về 401 Unauthorized

**Nguyên nhân**: JWT token hết hạn hoặc không hợp lệ

**Giải pháp**:
1. Logout và login lại
2. Check localStorage có token không
3. Verify token chưa expired

### Issue 4: Sync API trả về 404 Video Not Found

**Nguyên nhân**: Video ID không tồn tại hoặc không phải của user

**Giải pháp**:
- Check video ID trong database
- Verify user ownership

### Issue 5: DoodStream API error

**Nguyên nhân**: 
- API key không hợp lệ
- File code không tồn tại
- DoodStream API down

**Giải pháp**:
1. Check API key trong `application.yaml`
2. Verify file_code trong database
3. Test DoodStream API trực tiếp

## Best Practices

### 1. Auto-sync sau upload

Thêm polling sau khi upload:

```typescript
const pollVideoStatus = async (videoId: string) => {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5s
    
    const video = await videoApi.syncVideoInfo(videoId);
    
    if (video.status === 'READY' && video.thumbnailUrl) {
      console.log('✅ Video ready!');
      return video;
    }
    
    attempts++;
  }
};
```

### 2. Hiển thị placeholder

Nếu không có thumbnail, hiển thị placeholder:

```tsx
<img
  src={video.thumbnailUrl || 'https://via.placeholder.com/640x360/1f2937/ffffff?text=Video'}
  alt={video.title}
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/640x360/1f2937/ffffff?text=No+Thumbnail';
  }}
/>
```

### 3. Hiển thị status badge

```tsx
{video.status === 'PROCESSING' && (
  <div className="text-yellow-600">
    ⏳ Đang xử lý...
  </div>
)}
```

### 4. Disable actions khi processing

```tsx
<button
  disabled={video.status !== 'READY'}
  className="disabled:opacity-50 disabled:cursor-not-allowed"
>
  Xem video
</button>
```

## Monitoring

### Backend logs

```java
log.info("📹 Upload video: {}", video.getId());
log.info("✅ Upload thành công! FileCode: {}", uploadResult.getFileCode());
log.info("🔄 Syncing video: {}", videoId);
log.info("✅ Sync thành công: {} views", video.getViews());
```

### Frontend logs

```typescript
console.log('📹 Videos response:', response);
console.log('🔄 Syncing video:', videoId);
console.log('✅ Sync response:', updatedVideo);
```

## Tham khảo

- [VIDEO_SYNC_GUIDE.md](../../backendWVideos/docs/VIDEO_SYNC_GUIDE.md)
- [VIDEO_API_GUIDE.md](../../backendWVideos/docs/VIDEO_API_GUIDE.md)
- [DoodStream API Docs](https://doodstream.com/api-docs)
