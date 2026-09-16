'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import videoApi from '@/lib/apis/video.api';
import { categoryApi, Category } from '@/lib/apis/category.api';
import { useAuth } from '@/lib/hooks/useAuth';
import type { VideoResponse, VideoUploadData } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ThumbnailSelector from '@/components/video/ThumbnailSelector';

type IconProps = { className?: string };

const PencilIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const VideoCameraIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ImageIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

const SaveIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
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

// Định dạng thời lượng giây thành mm:ss / h:mm:ss
const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;
  const { user } = useAuth();

  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<VideoUploadData>({
    title: '',
    description: '',
    isPublic: true,
    categoryIds: [],
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [priceOption, setPriceOption] = useState<string>('free'); // 'free' | số | 'custom'
  const [customPrice, setCustomPrice] = useState<string>('');

  // Giá video: 0 = miễn phí
  const price =
    priceOption === 'free'
      ? 0
      : priceOption === 'custom'
        ? Number(customPrice) || 0
        : Number(priceOption);

  // Video có phí thì bắt buộc công khai (không cho tắt) - giống trang upload
  useEffect(() => {
    if (price > 0 && !formData.isPublic) {
      setFormData((prev) => ({ ...prev, isPublic: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  // Load video data on mount
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const data = await videoApi.getVideoById(videoId);
        setVideo(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          isPublic: data.isPublic ?? true,
          categoryIds: data.categories?.map(c => c.id) || [],
          tags: data.tags || [],
          thumbnailUrl: data.thumbnailUrl || '',
        });
        // Khởi tạo giá hiện tại của video vào form (giống các select giá trên trang upload)
        const currentPrice = data.price ?? 0;
        const presetPrices = [5000, 10000, 15000, 20000, 25000, 30000];
        if (currentPrice > 0 && presetPrices.includes(currentPrice)) {
          setPriceOption(String(currentPrice));
        } else if (currentPrice > 0) {
          setPriceOption('custom');
          setCustomPrice(String(currentPrice));
        } else {
          setPriceOption('free');
          setCustomPrice('');
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        router.push('/profile?tab=my-videos');
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId, router]);

  // Load categories
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

  // Tag handlers
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;

    if ((formData.tags?.length || 0) >= 10) {
      setError('Tối đa 10 tags');
      return;
    }

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

  // Thumbnail selector callback
  const handleThumbnailChange = (url: string | null) => {
    setFormData(prev => ({ ...prev, thumbnailUrl: url || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (price < 0) {
      setError('Giá video không hợp lệ');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await videoApi.updateVideo(videoId, {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        isPublic: formData.isPublic,
        categoryIds: formData.categoryIds,
        thumbnailUrl: formData.thumbnailUrl,
        price,
      });

      router.push('/profile?tab=my-videos');
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-secondary flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-primary rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/15 flex items-center justify-center">
              <LockIcon className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-foreground/60 mb-6">
              Bạn cần đăng nhập để chỉnh sửa video
            </p>
            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full btn-accent font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Đăng nhập ngay
              </Link>
              <button
                onClick={handleCancel}
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

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-secondary flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </main>
        <Footer />
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-secondary flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-primary rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/15 flex items-center justify-center">
              <VideoCameraIcon className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Video không tồn tại
            </h2>
            <p className="text-foreground/60 mb-6">
              Video này có thể đã bị xóa hoặc không tồn tại
            </p>
            <Link
              href="/profile?tab=my-videos"
              className="block w-full btn-accent font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Về trang hồ sơ
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const posterUrl = video.splashImageUrl || video.thumbnailUrl;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <PencilIcon className="w-6 h-6 text-[var(--btn-accent-text)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">Chỉnh sửa Video</h1>
              <p className="text-sm text-foreground/60 truncate">Cập nhật thông tin cho “{video.title}”</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Video hiện tại & thumbnail */}
            <section className="bg-primary shadow-sm rounded-xl p-5 sm:p-6">
              <SectionHeader
                icon={<VideoCameraIcon />}
                title="Video hiện tại & ảnh thu nhỏ"
                desc="Tệp video không thể thay đổi — bạn chỉ cập nhật thông tin và thumbnail"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Video hiện tại */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Video hiện tại</span>
                    {video.duration > 0 && (
                      <span className="text-xs text-foreground/60">{formatDuration(video.duration)}</span>
                    )}
                  </div>
                  {posterUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-black border border-accent/20 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={posterUrl}
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                      />
                      {video.duration > 0 && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-xs font-medium">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-black/80 rounded-xl flex items-center justify-center border border-accent/20">
                      <p className="text-foreground/50">Không có ảnh xem trước</p>
                    </div>
                  )}
                  <div className="bg-secondary rounded-xl p-4 mt-3 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                      <VideoCameraIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
                      <p className="text-xs text-foreground/60">
                        {video.views.toLocaleString('vi-VN')} lượt xem · {video.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <ImageIcon className="w-4 h-4 text-accent" />
                    Thumbnail (tùy chọn)
                  </div>
                  <ThumbnailSelector
                    thumbnailUrl={formData.thumbnailUrl || null}
                    onThumbnailChange={handleThumbnailChange}
                    disabled={saving}
                  />
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
                    disabled={saving}
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
                    disabled={saving}
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
                          disabled={saving}
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
                        disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                  onClick={() => setFormData({ ...formData, isPublic: true })}
                  icon={<GlobeIcon className="w-5 h-5" />}
                  title="Công khai"
                  desc={price > 0 ? 'Mọi người xem được, phải mua để xem' : 'Mọi người đều có thể tìm và xem video'}
                />
                <VisibilityOption
                  selected={formData.isPublic === false}
                  disabled={saving || price > 0}
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
                    disabled={saving}
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
                      disabled={saving}
                    />
                  )}
                </div>
                <p className="text-xs text-foreground/50 mt-2">
                  Miễn phí = 0đ. Video có giá sẽ bắt buộc công khai và người xem phải mua để xem. Người đã mua ở giá cũ vẫn xem bình thường.
                </p>
              </div>
            </section>

            {/* Action */}
            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-accent/10 transition-colors disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || formData.categoryIds.length < 1 || formData.categoryIds.length > 10}
                  className="btn-accent inline-flex items-center gap-2 font-medium py-2.5 px-6 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90"
                >
                  <SaveIcon className="w-5 h-5" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
