'use client';

import { useState, useEffect } from 'react';
import { VideoResponse } from '@/lib/apis/video.api';
import { categoryApi, Category } from '@/lib/apis/category.api';

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoResponse | null;
  onSave: (videoId: string, data: { title: string; description: string; isPublic: boolean; categoryIds: string[] }) => Promise<void>;
}

export default function EditVideoModal({ isOpen, onClose, video, onSave }: EditVideoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    if (categoryIds.length < 3) {
      alert('Vui lòng chọn ít nhất 3 thể loại');
      return;
    }

    setSaving(true);
    try {
      await onSave(video.id, {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        categoryIds
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
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-primary rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-accent'>
          <h2 className='text-xl font-semibold text-foreground'>
            ✏️ Chỉnh sửa video
          </h2>
          <button
            onClick={onClose}
            className='text-foreground hover:text-accent transition-colors'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {/* Title */}
          <div>
            <label htmlFor='title' className='block text-sm font-medium text-foreground mb-2'>
              Tiêu đề *
            </label>
            <input
              type='text'
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='auth-input'
              placeholder='Nhập tiêu đề video...'
              required
              maxLength={200}
            />
            <div className='text-xs text-foreground opacity-60 mt-1'>
              {title.length}/200 ký tự
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor='description' className='block text-sm font-medium text-foreground mb-2'>
              Mô tả
            </label>
            <textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='auth-input resize-none'
              placeholder='Nhập mô tả video...'
              rows={4}
              maxLength={1000}
            />
            <div className='text-xs text-foreground opacity-60 mt-1'>
              {description.length}/1000 ký tự
            </div>
          </div>

          {/* Category - Multi-select với checkboxes */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Thể loại * (chọn ít nhất 3)
            </label>
            <div className='bg-primary border border-accent rounded-lg p-3 max-h-48 overflow-y-auto'>
              {loadingCategories ? (
                <div className='text-sm text-foreground opacity-60 text-center py-4'>
                  Đang tải danh sách thể loại...
                </div>
              ) : categories.length === 0 ? (
                <div className='text-sm text-foreground opacity-60 text-center py-4'>
                  Không có thể loại nào
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-2'>
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-center p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        categoryIds.includes(category.id)
                          ? 'border-accent bg-accent bg-opacity-20'
                          : 'border-transparent bg-secondary hover:border-accent hover:border-opacity-50'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={categoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoryIds([...categoryIds, category.id]);
                          } else {
                            setCategoryIds(categoryIds.filter((id) => id !== category.id));
                          }
                        }}
                        className='h-4 w-4 text-accent focus:ring-accent border-accent rounded mr-2'
                      />
                      <span className='text-sm text-foreground'>
                        {category.icon} {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className='text-xs text-foreground opacity-60 mt-1'>
              Đã chọn: {categoryIds.length}/3 (tối thiểu)
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Quyền riêng tư
            </label>
            <div className='space-y-2'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  name='privacy'
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className='mr-2 text-accent'
                />
                <span className='text-foreground'>🌐 Công khai - Mọi người có thể xem</span>
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  name='privacy'
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className='mr-2 text-accent'
                />
                <span className='text-foreground'>🔒 Riêng tư - Chỉ bạn có thể xem</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-accent text-foreground rounded-lg hover:bg-secondary transition-colors'
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type='submit'
              className='flex-1 btn-accent px-4 py-2 rounded-lg transition-colors disabled:opacity-50'
              disabled={saving || !title.trim() || categoryIds.length < 3}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}