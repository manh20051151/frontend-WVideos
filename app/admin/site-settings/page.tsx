'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { siteSettingApi, SITE_SETTING_LABELS, type SiteSettingInfo } from '@/lib/apis';
import { useAuth } from '@/lib/hooks/useAuth';
import { uploadImageToImgbb } from '@/lib/utils/imgbb';

/**
 * Trang quản trị: cấu hình logo site + favicon
 * - Upload ảnh (qua ImgBB) rồi lưu URL vào site settings
 * - Logo hiển thị trên header website và trong email hệ thống
 * - Favicon hiển thị trên tab trình duyệt
 * - Xóa cấu hình = quay về mặc định (logo chữ wd video / không favicon)
 */

export default function AdminSiteSettingsPage() {
  const { user, mounted } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.name === 'ADMIN');

  const [settings, setSettings] = useState<SiteSettingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await siteSettingApi.getAll();
      setSettings(data ?? []);
    } catch {
      setError('Không tải được cấu hình site');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && isAdmin) load();
  }, [mounted, isAdmin, load]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const getValue = (key: string) =>
    settings.find((s) => s.settingKey === key)?.settingValue || pendingPreview[key] || '';

  const handleUpload = useCallback(
    async (key: string, file: File) => {
      setError(null);
      const result = await uploadImageToImgbb(file);
      if (!result.success || !result.data?.url) {
        setError(result.error || 'Upload ảnh thất bại');
        return;
      }
      setPendingPreview((prev) => ({ ...prev, [key]: result.data!.url! }));
    },
    []
  );

  const handleSave = async (key: string) => {
    const value = pendingPreview[key] ?? getValue(key) ?? '';
    if (savingKey) return;
    setSavingKey(key);
    setError(null);
    try {
      const updated = await siteSettingApi.update(key, value);
      setSettings((prev) => prev.map((s) => (s.settingKey === key ? updated : s)));
      setPendingPreview((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      showFeedback('Đã lưu cấu hình');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Lưu thất bại, thử lại');
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemove = async (key: string) => {
    if (savingKey) return;
    setSavingKey(key);
    setError(null);
    try {
      const updated = await siteSettingApi.update(key, '');
      setSettings((prev) => prev.map((s) => (s.settingKey === key ? updated : s)));
      setPendingPreview((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      showFeedback('Đã xóa cấu hình, quay về mặc định');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Xóa thất bại, thử lại');
    } finally {
      setSavingKey(null);
    }
  };

  if (!mounted || (mounted && !isAdmin)) {
    return (
      <div className='min-h-screen flex flex-col'>
        <Header />
        <div className='flex-1 flex items-center justify-center text-foreground opacity-70'>
          Chỉ dành cho quản trị viên.
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-primary'>
      <Header />
      <main className='flex-1 w-full max-w-3xl mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold text-foreground mb-1'>Logo & Favicon</h1>
        <p className='text-sm text-foreground opacity-60 mb-6'>
          Cấu hình nhận diện thương hiệu của website. Để trống nếu muốn dùng logo chữ mặc định.
        </p>

        {feedback && (
          <div className='mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg text-sm'>
            {feedback}
          </div>
        )}
        {error && (
          <div className='mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='text-center py-16 text-foreground opacity-60'>Đang tải...</div>
        ) : (
          <div className='space-y-6'>
            {(['SITE_LOGO', 'SITE_FAVICON'] as const).map((key) => {
              const meta = SITE_SETTING_LABELS[key];
              const current = getValue(key);
              const hasPending = key in pendingPreview;
              return (
                <div key={key} className='rounded-xl border border-secondary bg-secondary overflow-hidden'>
                  <div className='px-5 py-3 border-b border-secondary'>
                    <h2 className='font-semibold text-foreground'>{meta.title}</h2>
                    <p className='text-xs text-foreground opacity-60'>{meta.description}</p>
                  </div>

                  <div className='p-5 space-y-4'>
                    {/* Xem trước */}
                    <div className='flex items-center gap-4'>
                      <div
                        className='flex items-center justify-center rounded-lg border border-secondary bg-primary'
                        style={{ width: 96, height: 64 }}
                      >
                        {current ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={current}
                            alt={meta.title}
                            className='max-w-[80px] max-h-[48px] object-contain'
                          />
                        ) : key === 'SITE_LOGO' ? (
                          <span className='text-lg font-bold'>
                            <span className='text-accent'>wd</span>
                            <span className='text-foreground'>video</span>
                          </span>
                        ) : (
                          <span className='text-xs text-foreground opacity-50'>Chưa có</span>
                        )}
                      </div>
                      <div className='text-sm text-foreground opacity-70'>
                        {current ? (
                          <>
                            {hasPending && <p className='text-amber-500'>Bản mới - chưa lưu</p>}
                            <p className='font-mono text-xs break-all'>{current}</p>
                          </>
                        ) : (
                          <p>Đang dùng mặc định</p>
                        )}
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className='flex items-center gap-3 flex-wrap'>
                      <label
                        className={`px-4 py-2 rounded-lg border border-accent text-accent text-sm cursor-pointer hover:bg-accent hover:bg-opacity-10 transition-colors ${
                          savingKey === key ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        Chọn ảnh mới
                        <input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          disabled={savingKey === key}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(key, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button
                        type='button'
                        onClick={() => handleSave(key)}
                        disabled={savingKey === key || (!hasPending && !current)}
                        className='px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {savingKey === key ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      {(current || hasPending) && (
                        <button
                          type='button'
                          onClick={() => handleRemove(key)}
                          disabled={savingKey === key}
                          className='px-4 py-2 rounded-lg border border-red-400/60 text-red-500 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50'
                        >
                          Xóa (dùng mặc định)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
