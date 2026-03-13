'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoResponse } from '@/lib/apis/video.api';
import { categoryApi, Category } from '@/lib/apis/category.api';
import ThumbnailSelector from './ThumbnailSelector';

import { useDarkMode } from '@/lib/hooks/useDarkMode';

// Icons
const XIcon = () => (
  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
  </svg>
);

const SaveIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' />
  </svg>
);

const GlobeIcon = () => (
  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' />
  </svg>
);

const LockIcon = () => (
  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
  </svg>
);

const FolderIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' />
  </svg>
);

const TypeIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16m-7 6h7' />
  </svg>
);

const AlignLeftIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h10M4 18h16' />
  </svg>
);

const ImageIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
  </svg>
);

const CheckIcon = () => (
  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
  </svg>
);

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoResponse | null;
  onSave: (videoId: string, data: { title: string; description: string; isPublic: boolean; categoryIds: string[]; thumbnailUrl?: string | null }) => Promise<void>;
}

export default function EditVideoModal({ isOpen, onClose, video, onSave }: EditVideoModalProps) {
  const { isDark } = useDarkMode();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load categories khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Cập nhật form khi video thay đổi
  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      setIsPublic(video.isPublic ?? true);
      setCategoryIds(video.categories?.map(c => c.id) || []);
      setThumbnailUrl(video.thumbnailUrl || null);
    }
  }, [video]);

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

  const handleThumbnailChange = useCallback((url: string | null) => {
    setThumbnailUrl(url);
  }, []);

  const toggleCategory = (categoryId: string) => {
    setCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      if (prev.length >= 10) {
        alert('Chỉ được chọn tối đa 10 thể loại');
        return prev;
      }
      return [...prev, categoryId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    if (categoryIds.length < 1) {
      alert('Vui lòng chọn ít nhất 1 thể loại');
      return;
    }

    if (categoryIds.length > 10) {
      alert('Chỉ được chọn tối đa 10 thể loại');
      return;
    }

    setSaving(true);
    try {
      await onSave(video.id, {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        categoryIds,
        thumbnailUrl
      });
      onClose();
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Lỗi khi lưu video: ' + (error as any)?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !video) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      {/* Backdrop with better blur */}
      <div className='absolute inset-0 bg-black/70 backdrop-blur-md' />

      {/* Modal */}
      <div
        className={`relative rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-black-100 dark:bg-black rounded-xl'>
              <SaveIcon />
            </div>
            <div>
              <h2 className='text-lg font-semibold  dark:text-white'>
                Chỉnh sửa video
              </h2>
              <p className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                {video.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors group ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            disabled={saving}
          >
            <XIcon />
          </button>
        </div>

        {/* Form - Grid Layout */}
        <form onSubmit={handleSubmit} className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Left Column - Thumbnail */}
            <div className='space-y-4'>
              {/* Current Thumbnail Preview */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <ImageIcon />
                  Thumbnail hiện tại
                </label>
                <div className={`relative aspect-video rounded-xl overflow-hidden group ${
                  isDark ? 'bg-gray-900 border-gray-600' : 'bg-gray-100 border-gray-300'
                } border`}>
                  <img
                    src={video.thumbnailUrl}
                    alt='Current thumbnail'
                    className='w-full h-full object-cover'
                    loading='lazy'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                </div>
              </div>

              {/* Thumbnail Selector */}
              <ThumbnailSelector
                thumbnailUrl={thumbnailUrl}
                onThumbnailChange={handleThumbnailChange}
                disabled={saving}
              />
            </div>
            {/* Right Column - Form Fields */}
            <div className='space-y-5'>
              {/* Title */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <TypeIcon />
                  Tiêu đề <span className={isDark ? 'text-red-400' : 'text-red-500'}>*</span>
                </label>
                <input
                  type='text'
                  id='title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                    isDark 
                      ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  } border`}
                  placeholder='Nhập tiêu đề video...'
                  required
                  maxLength={200}
                />
                <div className='flex justify-between mt-1.5'>
                  <span className='text-xs text-gray-500'>
                    Tiêu đề nên ngắn gọn, hấp dẫn
                  </span>
                  <span className={`text-xs ${title.length > 180 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>
                    {title.length}/200
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <AlignLeftIcon />
                  Mô tả
                </label>
                <textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none ${
                    isDark 
                      ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  } border`}
                  placeholder='Nhập mô tả video...'
                  rows={3}
                  maxLength={1000}
                />
                <div className='flex justify-between mt-1.5'>
                  <span className='text-xs text-gray-500'>
                    Mô tả giúp người xem hiểu rõ hơn
                  </span>
                  <span className={`text-xs ${description.length > 900 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>
                    {description.length}/1000
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <FolderIcon />
                  Thể loại <span className={isDark ? 'text-red-400' : 'text-red-500'}>*</span>
                  <span className={`text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ({categoryIds.length}/10)
                  </span>
                </label>
                <div className={`rounded-xl p-3 max-h-40 overflow-y-auto border ${
                  isDark ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-300'
                }`}>
                  {loadingCategories ? (
                    <div className='flex items-center justify-center py-6'>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 dark:border-blue-400' />
                    </div>
                  ) : categories.length === 0 ? (
                    <div className={`text-sm text-center py-6 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      Không có thể loại nào
                    </div>
                  ) : (
                    <div className='flex flex-wrap gap-2'>
                      {categories.map((category) => {
                        const isSelected = categoryIds.includes(category.id);
                        return (
                          <button
                            key={category.id}
                            type='button'
                            onClick={() => toggleCategory(category.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : isDark 
                                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {category.icon}
                            <span>{category.name}</span>
                            {isSelected && (
                              <CheckIcon />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {categoryIds.length < 1 && (
                  <p className={`text-xs text-red-400 ${isDark ? 'dark:text-red-400' : ''} mt-1.5`}>
                    Vui lòng chọn ít nhất 1 thể loại
                  </p>
                )}
              </div>

              {/* Privacy */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {isPublic ? <GlobeIcon /> : <LockIcon />}
                  Quyền riêng tư
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isPublic
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : isDark 
                          ? 'border-gray-600 bg-gray-900 text-gray-200 hover:bg-gray-800'
                          : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <GlobeIcon />
                    <div className='text-left'>
                      <p className='text-sm font-medium'>Công khai</p>
                      <p className='text-xs opacity-70'>Mọi người đều xem được</p>
                    </div>
                  </button>
                  <button
                    type='button'
                    onClick={() => setIsPublic(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      !isPublic
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : isDark 
                          ? 'border-gray-600 bg-gray-900 text-gray-200 hover:bg-gray-800'
                          : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <LockIcon />
                    <div className='text-left'>
                      <p className='text-sm font-medium'>Riêng tư</p>
                      <p className='text-xs opacity-70'>Chỉ bạn xem được</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex items-center justify-end gap-3 pt-6 mt-6 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              type='button'
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all disabled:opacity-50 ${
                isDark 
                  ? 'text-gray-200 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type='submit'
              className='flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={saving || !title.trim() || categoryIds.length < 1 || categoryIds.length > 10}
            >
              {saving ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                  Đang lưu...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}