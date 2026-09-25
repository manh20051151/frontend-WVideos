'use client';

import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import type { CategoryTranslation, CategoryTranslationUpsertItem } from '@/lib/apis/category.api';

// Lấy message lỗi từ response của backend, fallback văn bản mặc định
const getErrorMessage = (err: unknown, fallback: string) => {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
};

// Nhãn hiển thị cho các mã ngôn ngữ bản dịch nội dung (BCP-47)
const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  'zh-CN': '中文 (简体)',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
  th: 'ไทย',
  lo: 'ລາວ',
  km: 'ភាសាខ្មែរ',
};

// API client đã bind đúng endpoint (categoryApi cho thể loại video, newsApi cho tin tức)
export interface TranslationsApi {
  getCategoryTranslations: (id: string) => Promise<CategoryTranslation[]>;
  updateCategoryTranslations: (
    id: string,
    translations: CategoryTranslationUpsertItem[]
  ) => Promise<CategoryTranslation[]>;
}

interface TranslationsModalProps {
  open: boolean;
  onClose: () => void;
  /** Tên gốc tiếng Việt của danh mục (hiển thị trong tiêu đề) */
  title: string;
  categoryId: string;
  api: TranslationsApi;
}

/**
 * Modal admin quản lý bản dịch TÊN danh mục (thể loại video + danh mục tin tức)
 * do Gemini dịch tự động: sửa lại cho tự nhiên, dịch tay ngôn ngữ còn thiếu,
 * hoặc xóa bản dịch sai (xóa nội dung ô nhập rồi Lưu -> fallback tên tiếng Việt gốc).
 */
export default function TranslationsModal({ open, onClose, title, categoryId, api }: TranslationsModalProps) {
  const [items, setItems] = useState<CategoryTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getCategoryTranslations(categoryId)
      .then((data) => {
        if (!cancelled) setItems(data ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Lỗi khi tải bản dịch'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryId]);

  if (!open) return null;

  const handleChange = (locale: string, value: string) => {
    setItems((prev) => prev.map((t) => (t.locale === locale ? { ...t, name: value } : t)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const updated = await api.updateCategoryTranslations(
        categoryId,
        items.map((t) => ({ locale: t.locale, name: (t.name ?? '').trim() }))
      );
      setItems(updated ?? []);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Lỗi khi lưu bản dịch'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60' onClick={onClose} />
      <div className='relative bg-secondary rounded-xl shadow-2xl border border-accent w-full max-w-lg max-h-[85vh] flex flex-col'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-accent'>
          <h3 className='text-lg font-semibold text-foreground'>
            🌐 Bản dịch: <span className='text-accent'>{title}</span>
          </h3>
          <button onClick={onClose} className='text-foreground/60 hover:text-foreground text-2xl leading-none'>
            ×
          </button>
        </div>

        <div className='px-6 py-4 overflow-y-auto flex-1'>
          {loading ? (
            <div className='py-8 text-center'>
              <div className='animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3' />
              <p className='text-foreground opacity-70 text-sm'>Đang tải bản dịch...</p>
            </div>
          ) : (
            <>
              <p className='text-xs text-foreground opacity-60 mb-4'>
                Sửa bản dịch Gemini cho tự nhiên hơn, hoặc để trống rồi Lưu để xóa bản dịch
                (ngôn ngữ đó sẽ hiển thị tên tiếng Việt gốc).
              </p>
              <div className='space-y-3'>
                {items.map((t) => (
                  <div key={t.locale} className='flex items-center gap-3'>
                    <span className='w-28 shrink-0 text-sm text-foreground'>
                      {LOCALE_LABELS[t.locale] ?? t.locale}
                    </span>
                    <input
                      type='text'
                      value={t.name ?? ''}
                      onChange={(e) => handleChange(t.locale, e.target.value)}
                      placeholder='Chưa dịch'
                      className='flex-1 px-3 py-2 bg-primary border border-accent rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-highlight'
                    />
                  </div>
                ))}
                {items.length === 0 && (
                  <p className='text-sm text-foreground opacity-60 py-4 text-center'>
                    Chưa cấu hình ngôn ngữ dịch (thiếu GEMINI_API_KEY).
                  </p>
                )}
              </div>
            </>
          )}

          {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
        </div>

        <div className='flex justify-end gap-3 px-6 py-4 border-t border-accent'>
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-lg text-sm text-foreground hover:bg-primary transition-colors'
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className='btn-accent px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50'
          >
            {saving ? 'Đang lưu...' : 'Lưu bản dịch'}
          </button>
        </div>
      </div>
    </div>
  );
}
