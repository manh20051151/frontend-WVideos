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

export default function UploadVideoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<VideoUploadData>({
    title: '',
    description: '',
    isPublic: true,
    categoryId: '',
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load categories khi component mount
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

    try {
      setUploading(true);
      setProgress(10);
      setError('');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await videoApi.uploadVideo(file, formData);

      clearInterval(progressInterval);
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
            </div>

            {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Chọn video *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-accent border-dashed rounded-lg hover:border-highlight transition-colors">
                <div className="space-y-1 text-center">
                  {preview ? (
                    <div className="mb-4">
                      <video
                        src={preview}
                        controls
                        className="mx-auto h-48 w-auto rounded-lg"
                      />
                      <p className="mt-2 text-sm text-foreground opacity-70">
                        {file?.name} ({formatFileSize(file?.size || 0)})
                      </p>
                    </div>
                  ) : (
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
                  )}
                  <div className="flex text-sm text-foreground opacity-70">
                    <label className="relative cursor-pointer bg-primary rounded-md font-medium text-accent hover:text-highlight focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent px-3 py-2">
                      <span>{file ? 'Chọn video khác' : 'Chọn video'}</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="video/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-foreground opacity-50">
                    MP4, AVI, MOV, WMV tối đa 2GB
                  </p>
                </div>
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

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Thể loại
              </label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="auth-input"
                disabled={uploading || loadingCategories}
              >
                <option value="">-- Chọn thể loại --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {loadingCategories && (
                <div className="text-xs text-foreground opacity-60 mt-1">
                  Đang tải danh sách thể loại...
                </div>
              )}
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
                disabled={uploading || !file}
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
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
