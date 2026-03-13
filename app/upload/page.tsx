'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import videoApi from '@/lib/apis/video.api';
import { categoryApi, Category } from '@/lib/apis/category.api';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatFileSize } from '@/lib/utils';
import type { VideoUploadData } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ThumbnailSelector from '@/components/video/ThumbnailSelector';

export default function UploadVideoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<VideoUploadData>({
    title: '',
    description: '',
    isPublic: true,
    categoryIds: [],
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Thêm tag khi nhấn Enter hoặc dấu phẩy
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;
    
    // Tối đa 10 tags
    if ((formData.tags?.length || 0) >= 10) {
      setError('Tối đa 10 tags');
      return;
    }
    
    // Không trùng lặp
    if (formData.tags?.includes(trimmed)) {
      setTagInput('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), trimmed],
    }));
    setTagInput('');
    setError('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await categoryApi.getActiveCategories();
      setCategories(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách thể loại:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Show login required message if not authenticated
  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-primary flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-secondary rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-foreground opacity-70 mb-6">
              Bạn cần đăng nhập để upload video
            </p>
            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full btn-accent font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Đăng nhập ngay
              </Link>
              <button
                onClick={() => router.back()}
                className="block w-full border border-accent text-foreground font-medium py-3 px-6 rounded-lg hover:bg-accent hover:bg-opacity-20 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        setError('Vui lòng chọn file video');
        return;
      }

      // Validate file size (max 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      if (selectedFile.size > maxSize) {
        setError('File quá lớn. Kích thước tối đa là 2GB');
        return;
      }

      setFile(selectedFile);
      setError('');

      // Create preview
      const videoUrl = URL.createObjectURL(selectedFile);
      setPreview(videoUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Vui lòng chọn file video');
      return;
    }

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề video');
      return;
    }

    if (formData.categoryIds.length < 1) {
      setError('Vui lòng chọn ít nhất 1 thể loại');
      return;
    }

    if (formData.categoryIds.length > 10) {
      setError('Chỉ được chọn tối đa 10 thể loại');
      return;
    }

    try {
      setUploading(true);
      setProgress(10);
      setError('');

      console.log('[UPLOAD] Bắt đầu upload video');
      const startApiTime = Date.now();

      // Chạy progress bar trong khi đợi API
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return prev;
          }
          return prev + 5;
        });
      }, 200);

      const result = await videoApi.uploadVideo(file, formData);

      clearInterval(progressInterval);
      const apiDuration = Date.now() - startApiTime;
      console.log(`[UPLOAD] API trả về sau ${apiDuration}ms`, result);
      setProgress(100);

      // Redirect to video detail or my videos
      setTimeout(() => {
        router.push('/my-videos');
      }, 1000);
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Upload thất bại. Vui lòng thử lại';
      setError(errorMessage);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // formatFileSize được import từ @/lib/utils

  return (
    <>
      <Header />
      <div className="min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-secondary shadow-lg rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-highlight px-6 py-8">
              <h1 className="text-3xl font-bold text-foreground">📹 Upload Video</h1>
              <p className="mt-2 text-foreground opacity-80">Chia sẻ video của bạn với cộng đồng</p>
            </div>

            {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* File Upload & Thumbnail - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Video Upload Section */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  📹 Chọn video *
                </label>
                {preview ? (
                  <div className="space-y-3">
                    {/* Video Player */}
                    <div className="relative rounded-xl overflow-hidden bg-black border-2 border-accent shadow-lg">
                      <video
                        src={preview}
                        controls
                        className="w-full aspect-video"
                      />
                    </div>
                    
                    {/* File Info Card */}
                    <div className="bg-primary border border-accent rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-accent bg-opacity-20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate" title={file?.name}>
                            {file?.name}
                          </p>
                          <p className="text-xs text-foreground opacity-60">
                            {formatFileSize(file?.size || 0)}
                          </p>
                        </div>
                      </div>
                      <label className="cursor-pointer flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-highlight transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Đổi video
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="relative block group cursor-pointer">
                    <div className="border-2 border-dashed border-accent rounded-xl p-8 text-center transition-all group-hover:border-highlight  group-hover:bg-opacity-5 h-[280px] flex flex-col justify-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent bg-opacity-10 flex items-center justify-center group-hover:bg-opacity-20 transition-colors">
                        <svg
                          className="w-10 h-10 "
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
                      </div>
                      <p className="text-lg font-medium text-foreground mb-1">
                        Click hoặc kéo thả video vào đây
                      </p>
                      <p className="text-sm text-foreground opacity-60 mb-4">
                        Hỗ trợ MP4, AVI, MOV, WMV
                      </p>
                      <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white font-medium rounded-lg group-hover:bg-highlight transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Chọn video từ máy
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                )}
                <p className="text-xs text-foreground opacity-50 mt-2">
                  * Tối đa 2GB. Video sẽ được xử lý sau khi upload.
                </p>
              </div>

              {/* Thumbnail Section */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  🖼️ Thumbnail (tùy chọn)
                </label>
                {file ? (
                  <ThumbnailSelector
                    thumbnailUrl={formData.thumbnailUrl || null}
                    onThumbnailChange={(url) => setFormData({ ...formData, thumbnailUrl: url || undefined })}
                    disabled={uploading}
                  />
                ) : (
                  <div className="border-2 border-dashed border-accent border-opacity-30 rounded-xl p-8 text-center bg-primary bg-opacity-50 h-[280px] flex flex-col justify-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-accent bg-opacity-10 flex items-center justify-center">
                      <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground opacity-50">
                      Chọn video trước để upload thumbnail
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Tiêu đề *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="auth-input"
                placeholder="Nhập tiêu đề video"
                disabled={uploading}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Mô tả
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="auth-input resize-none"
                placeholder="Mô tả về video của bạn..."
                disabled={uploading}
              />
            </div>

            {/* Category - Multi-select với checkboxes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Thể loại * (chọn từ 1-10 thể loại)
              </label>
              <div className="bg-secondary border border-accent rounded-lg p-4 max-h-60 overflow-y-auto">
                {loadingCategories ? (
                  <div className="text-sm text-foreground opacity-70 text-center py-4">
                    Đang tải danh sách thể loại...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-sm text-foreground opacity-70 text-center py-4">
                    Không có thể loại nào
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.categoryIds.includes(category.id)
                            ? 'border-highlight bg-highlight bg-opacity-10 text-black dark:text-white'
                            : 'border-transparent bg-primary hover:border-accent hover:border-opacity-50 text-accent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Kiểm tra không vượt quá 10
                              if (formData.categoryIds.length >= 10) {
                                setError('Chỉ được chọn tối đa 10 thể loại');
                                return;
                              }
                              setFormData({
                                ...formData,
                                categoryIds: [...formData.categoryIds, category.id],
                              });
                              setError('');
                            } else {
                              setFormData({
                                ...formData,
                                categoryIds: formData.categoryIds.filter((id) => id !== category.id),
                              });
                            }
                          }}
                          className="h-4 w-4 text-accent focus:ring-accent border-accent rounded mr-3"
                          disabled={uploading}
                        />
                        <span className="text-sm font-medium">
                          {category.icon} {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-foreground opacity-70 mt-2">
                Đã chọn: {formData.categoryIds.length}/10 (tối thiểu 1, tối đa 10)
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                Tags (tối đa 10)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-accent text-white"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-200"
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                className="auth-input"
                placeholder="Nhập tag và nhấn Enter (ví dụ: gaming, tutorial)"
                disabled={uploading}
              />
              <p className="text-xs text-foreground opacity-50 mt-1">
                Nhấn Enter hoặc dấu phẩy để thêm tag. Tối đa 10 tags.
              </p>
            </div>

            {/* Public/Private */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="h-4 w-4 text-accent focus:ring-accent border-accent rounded"
                disabled={uploading}
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-foreground">
                Công khai video (mọi người có thể xem)
              </label>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-foreground opacity-70">
                  <span>Đang upload...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-primary rounded-full h-2.5">
                  <div
                    className="bg-accent h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading || !file || formData.categoryIds.length < 1 || formData.categoryIds.length > 10}
                className="flex-1 btn-accent font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Đang upload...' : 'Upload Video'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={uploading}
                className="px-6 py-3 border border-accent rounded-lg text-foreground hover:bg-accent hover:bg-opacity-20 transition-colors disabled:cursor-not-allowed"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-secondary border border-accent rounded-lg p-3 max-w-3xl mx-auto">
          <h3 className="text-sm font-medium text-foreground mb-1">💡 Lưu ý:</h3>
          <ul className="text-xs text-foreground opacity-70 space-y-0.5 list-disc list-inside">
            <li>Tối đa 2GB, hỗ trợ MP4, AVI, MOV, WMV</li>
            <li>Video sẽ được xử lý sau khi upload</li>
            <li>Phải chọn từ 1 đến 10 thể loại cho video</li>
            <li>Có thể thêm tối đa 10 tags để dễ tìm kiếm</li>
          </ul>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
