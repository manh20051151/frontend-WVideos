'use client';

import { useState, useEffect } from 'react';
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

const VideoCameraIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ImageIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

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
  const [preview, setPreview] = useState<string | null>(null);
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
        if (data.thumbnailUrl) {
          setPreview(data.thumbnailUrl);
        }
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-foreground opacity-70 mb-6">
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

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-primary flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-primary flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-secondary rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Video không tồn tại
            </h2>
            <p className="text-foreground opacity-70 mb-6">
              Video này có thể đã bị xóa hoặc không tồn tại
            </p>
            <button
              onClick={handleCancel}
              className="block w-full btn-accent font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Về trang hồ sơ
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Header />
      <div className="min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-secondary shadow-lg rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-accent px-6 py-8">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <PencilIcon /> Chỉnh sửa Video
              </h1>
              <p className="mt-2 text-foreground opacity-80">Cập nhật thông tin video của bạn</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Video Preview & Thumbnail - 2 Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Video Preview Section */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <VideoCameraIcon /> Video hiện tại
                  </label>
                  {preview ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-black border-2 border-accent shadow-lg">
                        <video
                          src={preview}
                          controls
                          className="w-full aspect-video"
                        />
                      </div>

                      <div className="bg-primary border border-accent rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-accent bg-opacity-20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {video.title}
                            </p>
                            <p className="text-xs text-foreground opacity-60">
                              Video hiện tại
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
                      <p className="text-foreground opacity-50">Không có preview</p>
                    </div>
                  )}
                  <p className="text-xs text-foreground opacity-50 mt-2">
                    * Video không thể thay đổi, chỉ có thể cập nhật thông tin
                  </p>
                </div>

                {/* Thumbnail Section */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <ImageIcon /> Thumbnail (tùy chọn)
                  </label>
                  <ThumbnailSelector
                    thumbnailUrl={formData.thumbnailUrl || null}
                    onThumbnailChange={handleThumbnailChange}
                    disabled={saving}
                  />
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
                  disabled={saving}
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
                  disabled={saving}
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
                            disabled={saving}
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
                        disabled={saving}
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
                <p className="text-xs text-foreground opacity-50 mt-1">
                  Nhấn Enter hoặc dấu phẩy để thêm tag. Tối đa 10 tags.
                </p>
              </div>

              {/* Giá video - giống trang upload */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
                  Giá video
                </label>
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
                    className="auth-input mt-2"
                    placeholder="Nhập giá (VNĐ)"
                    disabled={saving}
                  />
                )}
                <p className="text-xs text-foreground opacity-50 mt-1">
                  Miễn phí = 0đ. Video có giá sẽ tự động bắt buộc công khai và người xem phải mua để xem.
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
                  disabled={saving || price > 0}
                />
                <label
                  htmlFor="isPublic"
                  className={`ml-2 block text-sm ${price > 0 ? 'text-foreground opacity-60' : 'text-foreground'}`}
                >
                  {price > 0
                    ? 'Công khai video (bắt buộc với video có phí - mọi người xem được, phải mua để xem)'
                    : 'Công khai video (mọi người có thể xem)'}
                </label>
              </div>

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
                  disabled={saving || formData.categoryIds.length < 1 || formData.categoryIds.length > 10}
                  className="flex-1 btn-accent font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 border border-accent rounded-lg text-foreground hover:bg-accent hover:bg-opacity-20 transition-colors disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}