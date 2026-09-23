'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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

type IconProps = { className?: string };

const VideoCameraIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ImageIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LightBulbIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const CloudUploadIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const InfoIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FolderIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const GlobeIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LockIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const MoneyIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

// Đầu mục chung cho từng section của form
function SectionHeader({ icon, title, desc }: { icon: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5 pb-4 border-b border-accent/15">
      <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {desc && <p className="text-xs text-foreground/60 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

// Thẻ lựa chọn chế độ hiển thị (Công khai / Riêng tư)
function VisibilityOption({
  selected,
  disabled,
  onClick,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
        selected
          ? 'border-accent bg-accent/10'
          : 'border-accent/20 enabled:hover:border-accent/50'
      } ${disabled && selected ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {selected && <CheckIcon className="w-4 h-4 text-accent ml-auto" />}
      </div>
      <p className="text-xs text-foreground/60 mt-1">{desc}</p>
    </button>
  );
}

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
  const [priceOption, setPriceOption] = useState<string>('free'); // 'free' | số | 'custom'
  const [customPrice, setCustomPrice] = useState<string>('');

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

  // Giá video: 0 = miễn phí
  const price =
    priceOption === 'free'
      ? 0
      : priceOption === 'custom'
        ? Number(customPrice) || 0
        : Number(priceOption);

  // Video có phí thì bắt buộc công khai (không cho tắt)
  useEffect(() => {
    if (price > 0 && !formData.isPublic) {
      setFormData((prev) => ({ ...prev, isPublic: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await categoryApi.getActiveCategories();
      setCategories(data);
    } catch (error) {
    } finally {
      setLoadingCategories(false);
    }
  };

  // Show login required message if not authenticated
  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-secondary flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-primary rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/15 flex items-center justify-center">
              <LockIcon className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-foreground/60 mb-6">
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
                className="block w-full py-3 px-6 rounded-lg text-sm font-medium text-foreground/70 hover:bg-accent/10 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>
        </main>
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

      // Đọc thời lượng video từ metadata (duration tính bằng giây)
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        if (probe.duration && isFinite(probe.duration)) {
          setFormData((prev) => ({ ...prev, duration: Math.round(probe.duration) }));
        }
      };
      probe.src = videoUrl;
    }
  };

  const toggleCategory = (categoryId: string) => {
    const selected = formData.categoryIds.includes(categoryId);
    if (selected) {
      setFormData({
        ...formData,
        categoryIds: formData.categoryIds.filter((id) => id !== categoryId),
      });
      return;
    }
    if (formData.categoryIds.length >= 10) {
      setError('Chỉ được chọn tối đa 10 thể loại');
      return;
    }
    setFormData({
      ...formData,
      categoryIds: [...formData.categoryIds, categoryId],
    });
    setError('');
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

      const result = await videoApi.uploadVideo(file, { ...formData, price });

      clearInterval(progressInterval);
      const apiDuration = Date.now() - startApiTime;
      setProgress(100);

      // Redirect to profile page with my-videos tab
      setTimeout(() => {
        router.push('/profile?tab=my-videos');
      }, 1000);
    } catch (err: any) {
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
      <main className="min-h-screen bg-secondary py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <VideoCameraIcon className="w-6 h-6 text-[var(--btn-accent-text)]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Upload Video</h1>
              <p className="text-sm text-foreground/60">Chia sẻ video của bạn với cộng đồng</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Tệp video & ảnh thu nhỏ */}
            <section className="bg-primary shadow-sm rounded-xl p-5 sm:p-6">
              <SectionHeader
                icon={<CloudUploadIcon />}
                title="Tệp video & ảnh thu nhỏ"
                desc="Hỗ trợ MP4, AVI, MOV, WMV — dung lượng tối đa 2GB"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Video Upload */}
                <div>
                  {preview ? (
                    <div className="space-y-3">
                      {/* Video Player */}
                      <div className="relative rounded-xl overflow-hidden bg-black border border-accent/20 shadow-sm">
                        <video
                          src={preview}
                          controls
                          className="w-full aspect-video"
                        />
                      </div>

                      {/* File Info Card */}
                      <div className="bg-secondary rounded-xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                            <VideoCameraIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" title={file?.name}>
                              {file?.name}
                            </p>
                            <p className="text-xs text-foreground/60">
                              {formatFileSize(file?.size || 0)}
                              {formData.duration ? ` · ${Math.round(formData.duration / 60)} phút` : ''}
                            </p>
                          </div>
                        </div>
                        <label className="cursor-pointer flex-shrink-0 btn-accent inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                          <CloudUploadIcon className="w-4 h-4" />
                          Đổi video
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
                      <div className="border-2 border-dashed border-accent/40 rounded-xl p-8 text-center transition-colors group-hover:border-accent bg-secondary/50 group-hover:bg-accent/5 h-[280px] flex flex-col justify-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <CloudUploadIcon className="w-10 h-10 text-accent" />
                        </div>
                        <p className="text-base sm:text-lg font-medium text-foreground mb-1">
                          Click hoặc kéo thả video vào đây
                        </p>
                        <p className="text-sm text-foreground/60 mb-4">
                          Hỗ trợ MP4, AVI, MOV, WMV
                        </p>
                        <span className="inline-flex items-center gap-2 px-6 py-2.5 btn-accent font-medium rounded-lg hover:opacity-90 transition-opacity">
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
                </div>

                {/* Thumbnail */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <ImageIcon className="w-4 h-4 text-accent" />
                    Thumbnail (tùy chọn)
                  </div>
                  {file ? (
                    <ThumbnailSelector
                      thumbnailUrl={formData.thumbnailUrl || null}
                      onThumbnailChange={(url) => setFormData({ ...formData, thumbnailUrl: url || undefined })}
                      disabled={uploading}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-accent/25 rounded-xl p-8 text-center bg-secondary/50 h-[280px] flex flex-col justify-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-accent/50" />
                      </div>
                      <p className="text-sm text-foreground/50">
                        Chọn video trước để lấy ảnh thu nhỏ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Thông tin video */}
            <section className="bg-primary shadow-sm rounded-xl p-5 sm:p-6">
              <SectionHeader
                icon={<InfoIcon />}
                title="Thông tin video"
                desc="Tiêu đề và mô tả rõ ràng giúp video dễ được tìm thấy hơn"
              />
              <div className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
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
              </div>
            </section>

            {/* Section 3: Thể loại & Tags */}
            <section className="bg-primary shadow-sm rounded-xl p-5 sm:p-6">
              <SectionHeader
                icon={<FolderIcon />}
                title="Thể loại & tags"
                desc="Chọn từ 1 đến 10 thể loại và tối đa 10 tags"
              />

              {/* Category - chips multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Thể loại <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-foreground/60">
                    Đã chọn {formData.categoryIds.length}/10
                  </span>
                </div>
                {loadingCategories ? (
                  <p className="text-sm text-foreground/60 py-4 text-center">Đang tải danh sách thể loại...</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-foreground/60 py-4 text-center">Không có thể loại nào</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const selected = formData.categoryIds.includes(category.id);
                      return (
                        <button
                          type="button"
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          disabled={uploading}
                          aria-pressed={selected}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selected
                              ? 'bg-accent border-accent text-[var(--btn-accent-text)]'
                              : 'bg-secondary border-transparent text-foreground/80 hover:border-accent/50'
                          }`}
                        >
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                          {selected && <CheckIcon className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mt-5">
                <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                  Tags <span className="text-foreground/40 font-normal">(tối đa 10)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-accent/15 text-accent"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:opacity-70 leading-none"
                        disabled={uploading}
                        aria-label={`Xóa tag ${tag}`}
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
                <p className="text-xs text-foreground/50 mt-1">
                  Nhấn Enter hoặc dấu phẩy để thêm tag.
                </p>
              </div>
            </section>

            {/* Section 4: Khả năng hiển thị & giá bán */}
            <section className="bg-primary shadow-sm rounded-xl p-5 sm:p-6">
              <SectionHeader
                icon={<GlobeIcon />}
                title="Khả năng hiển thị & giá bán"
                desc="Quyết định ai có thể xem video và có mất phí hay không"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <VisibilityOption
                  selected={formData.isPublic === true}
                  disabled={uploading}
                  onClick={() => setFormData({ ...formData, isPublic: true })}
                  icon={<GlobeIcon className="w-5 h-5" />}
                  title="Công khai"
                  desc={price > 0 ? 'Mọi người xem được, phải mua để xem' : 'Mọi người đều có thể tìm và xem video'}
                />
                <VisibilityOption
                  selected={formData.isPublic === false}
                  disabled={uploading || price > 0}
                  onClick={() => setFormData({ ...formData, isPublic: false })}
                  icon={<LockIcon className="w-5 h-5" />}
                  title="Riêng tư"
                  desc={price > 0 ? 'Video có giá bắt buộc phải công khai' : 'Chỉ mình bạn có thể xem video'}
                />
              </div>

              <div className="mt-5">
                <label htmlFor="price" className="flex items-center gap-2 block text-sm font-medium text-foreground mb-2">
                  <MoneyIcon className="w-4 h-4 text-accent" /> Giá video
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    id="price"
                    value={priceOption}
                    onChange={(e) => setPriceOption(e.target.value)}
                    className="auth-input"
                    disabled={uploading}
                  >
                    <option value="free">Miễn phí</option>
                    <option value="5000">5.000 VNĐ</option>
                    <option value="10000">10.000 VNĐ</option>
                    <option value="15000">15.000 VNĐ</option>
                    <option value="20000">20.000 VNĐ</option>
                    <option value="25000">25.000 VNĐ</option>
                    <option value="30000">30.000 VNĐ</option>
                    <option value="custom">Tùy chọn</option>
                  </select>
                  {priceOption === 'custom' && (
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="auth-input"
                      placeholder="Nhập giá (VNĐ)"
                      disabled={uploading}
                    />
                  )}
                </div>
                <p className="text-xs text-foreground/50 mt-2">
                  Mặc định miễn phí. Video có giá sẽ bắt buộc công khai và người xem phải mua để xem.
                </p>
              </div>
            </section>

            {/* Action */}
            <div className="space-y-4">
              {/* Progress Bar */}
              {uploading && (
                <div className="bg-primary shadow-sm rounded-xl p-5 sm:p-6 space-y-2">
                  <div className="flex justify-between text-sm text-foreground/70">
                    <span className="flex items-center gap-2">
                      <CloudUploadIcon className="w-4 h-4 text-accent" /> Đang upload...
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-accent/15 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-accent/10 transition-colors disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file || formData.categoryIds.length < 1 || formData.categoryIds.length > 10}
                  className="btn-accent inline-flex items-center gap-2 font-medium py-2.5 px-6 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90"
                >
                  <CloudUploadIcon className="w-5 h-5" />
                  {uploading ? 'Đang upload...' : 'Upload Video'}
                </button>
              </div>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-5 rounded-xl bg-accent/10 border border-accent/20 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
              <LightBulbIcon /> Lưu ý khi tải video lên
            </h3>
            <ul className="text-xs text-foreground/70 space-y-1 list-disc list-inside">
              <li>Tối đa 2GB, hỗ trợ MP4, AVI, MOV, WMV</li>
              <li>Video sẽ được xử lý sau khi upload</li>
              <li>Phải chọn từ 1 đến 10 thể loại cho video</li>
              <li>Có thể thêm tối đa 10 tags để dễ tìm kiếm</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
