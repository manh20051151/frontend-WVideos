'use client';

import { memo, useState, useCallback, useRef } from 'react';
import { uploadImageToImgbb, validateImage, ImgbbUploadResult } from '@/lib/utils/imgbb';

interface ThumbnailSelectorProps {
  thumbnailUrl: string | null;
  onThumbnailChange: (url: string | null) => void;
  disabled?: boolean;
}

const ThumbnailSelector = memo(function ThumbnailSelector({
  thumbnailUrl,
  onThumbnailChange,
  disabled = false,
}: ThumbnailSelectorProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(thumbnailUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tối ưu: Sử dụng useCallback để tránh tạo lại function
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImage(file);
    if (!validation.success) {
      setError(validation.error || 'Ảnh không hợp lệ');
      return;
    }

    // Create local preview ngay lập tức để UX tốt hơn
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setError(null);
    setUploading(true);

    try {
      const result: ImgbbUploadResult = await uploadImageToImgbb(file, 'video-thumbnail');

      if (result.success && result.data) {
        onThumbnailChange(result.data.url);
        // Cleanup local preview và dùng URL từ imgbb
        URL.revokeObjectURL(localPreview);
        setPreview(result.data.url);
      } else {
        setError(result.error || 'Upload thất bại');
        // Giữ preview local nếu upload fail
        onThumbnailChange(localPreview);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Có lỗi xảy ra khi upload ảnh');
      onThumbnailChange(localPreview);
    } finally {
      setUploading(false);
    }
  }, [onThumbnailChange]);

  const handleRemoveThumbnail = useCallback(() => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onThumbnailChange(null);
    setError(null);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview, onThumbnailChange]);

  const handleClickSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      {/* <label className="block text-sm font-medium text-foreground">
        🖼️ Thumbnail (tùy chọn)
      </label> */}

      {preview ? (
        <div className="relative group">
          {/* Preview thumbnail */}
          <div className="relative rounded-lg overflow-hidden border border-accent">
            <img
              src={preview}
              alt="Thumbnail preview"
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            
            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Đang upload...</span>
                </div>
              </div>
            )}

            {/* Hover actions */}
            {!uploading && !disabled && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={handleClickSelect}
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  🔄 Đổi ảnh
                </button>
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  🗑️ Xóa
                </button>
              </div>
            )}
          </div>

          {/* Success indicator */}
          {!uploading && !error && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Đã upload
            </div>
          )}
        </div>
      ) : (
        /* Upload placeholder */
        <div
          onClick={disabled ? undefined : handleClickSelect}
          className={`border-2 border-dashed border-accent rounded-lg p-8 text-center transition-colors h-[280px] flex flex-col justify-center items-center ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-highlight  hover:bg-opacity-5'
          }`}
        >
          <svg
            className="mx-auto h-12 w-12 text-accent"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-foreground opacity-70">
            Click để chọn thumbnail
          </p>
          <p className="text-xs text-foreground opacity-50 mt-1">
            JPG, PNG, GIF tối đa 10MB
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Info note */}
      <p className="text-xs text-foreground opacity-50">
        Nếu không chọn, hệ thống sẽ tự động tạo thumbnail từ video
      </p>
    </div>
  );
});

export default ThumbnailSelector;
