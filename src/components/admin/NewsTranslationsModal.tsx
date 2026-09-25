'use client';

import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { newsApi } from '@/lib/apis/news.api';
import type { NewsTranslation } from '@/lib/apis/news.api';

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

interface NewsTranslationsModalProps {
  open: boolean;
  onClose: () => void;
  /** Tiêu đề gốc tiếng Việt của bài tin (hiển thị trong tiêu đề modal) */
  title: string;
  newsId: string;
}

// Lấy message lỗi từ response của backend, fallback văn bản mặc định
const getErrorMessage = (err: unknown, fallback: string) => {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
};

/**
 * Modal admin quản lý bản dịch BÀI TIN TỨC (title + summary + content HTML)
 * do Gemini dịch tự động: sửa lại cho tự nhiên, dịch tay ngôn ngữ còn thiếu,
 * hoặc xóa bản dịch sai (xóa ô Tiêu đề rồi Lưu -> fallback nội dung tiếng Việt gốc).
 */
export default function NewsTranslationsModal({ open, onClose, title, newsId }: NewsTranslationsModalProps) {
  const [items, setItems] = useState<NewsTranslation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    newsApi.getNewsTranslations(newsId)
      .then((data) => {
        if (cancelled) return;
        setItems(data ?? []);
        // Mở panel ngôn ngữ đầu tiên còn thiếu bản dịch, không có thì mở panel đầu
        const firstMissing = (data ?? []).find((t) => !t.title)?.locale;
        setExpanded(firstMissing ?? (data ?? [])[0]?.locale ?? null);
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
  }, [open, newsId]);

  if (!open) return null;

  const handleChange = (locale: string, field: 'title' | 'summary' | 'content', value: string) => {
    setItems((prev) => prev.map((t) => (t.locale === locale ? { ...t, [field]: value } : t)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const updated = await newsApi.updateNewsTranslations(
        newsId,
        items.map((t) => ({
          locale: t.locale,
          title: (t.title ?? '').trim(),
          summary: t.summary ?? '',
          content: t.content ?? '',
        }))
      );
      setItems(updated ?? []);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Lỗi khi lưu bản dịch'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-primary border border-accent rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-highlight';

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60' onClick={onClose} />
      <div className='relative bg-secondary rounded-xl shadow-2xl border border-accent w-full max-w-3xl max-h-[88vh] flex flex-col'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-accent shrink-0'>
          <h3 className='text-lg font-semibold text-foreground truncate pr-4'>
            🌐 Bản dịch tin: <span className='text-accent'>{title}</span>
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
                Sửa bản dịch Gemini cho tự nhiên hơn, hoặc xóa ô Tiêu đề rồi Lưu để xóa bản dịch
                ngôn ngữ đó (hiển thị nội dung tiếng Việt gốc). Nội dung là HTML - giữ nguyên thẻ, chỉ sửa chữ.
              </p>
              <div className='space-y-2'>
                {items.map((t) => {
                  const isOpen = expanded === t.locale;
                  const hasTranslation = !!t.title;
                  return (
                    <div key={t.locale} className='border border-accent/40 rounded-lg overflow-hidden'>
                      <button
                        type='button'
                        onClick={() => setExpanded(isOpen ? null : t.locale)}
                        className='w-full flex items-center justify-between px-4 py-2.5 bg-primary hover:bg-primary/80 transition-colors'
                      >
                        <span className='flex items-center gap-2 text-sm font-medium text-foreground'>
                          {LOCALE_LABELS[t.locale] ?? t.locale}
                          {!hasTranslation && (
                            <span className='text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-foreground/60 border border-accent/40'>
                              Chưa dịch
                            </span>
                          )}
                          {hasTranslation && (
                            <span className='text-xs text-foreground/50 truncate max-w-[300px]'>
                              {t.title}
                            </span>
                          )}
                        </span>
                        <span className={`text-foreground/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                      </button>
                      {isOpen && (
                        <div className='p-4 space-y-3 bg-secondary'>
                          <div>
                            <label className='block text-xs font-medium text-foreground mb-1'>Tiêu đề</label>
                            <input
                              type='text'
                              value={t.title ?? ''}
                              onChange={(e) => handleChange(t.locale, 'title', e.target.value)}
                              placeholder='Trống = xóa bản dịch ngôn ngữ này'
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-foreground mb-1'>Tóm tắt</label>
                            <textarea
                              value={t.summary ?? ''}
                              onChange={(e) => handleChange(t.locale, 'summary', e.target.value)}
                              rows={2}
                              className={inputClass + ' resize-y'}
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-foreground mb-1'>Nội dung (HTML)</label>
                            <textarea
                              value={t.content ?? ''}
                              onChange={(e) => handleChange(t.locale, 'content', e.target.value)}
                              rows={10}
                              className={inputClass + ' resize-y font-mono text-xs'}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

        <div className='flex justify-end gap-3 px-6 py-4 border-t border-accent shrink-0'>
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
