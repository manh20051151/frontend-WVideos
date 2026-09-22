'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  emailTemplateApi,
  EMAIL_TEMPLATE_LABELS,
  EMAIL_TEMPLATE_PLACEHOLDERS,
  renderPreview,
  type EmailTemplateInfo,
} from '@/lib/apis';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Trang quản trị: chỉnh sửa nội dung email hệ thống
 * - Sửa tiêu đề + nội dung HTML (placeholder {{url}}, {{email}}, {{name}}, {{minutes}})
 * - Xem trước email với dữ liệu mẫu
 * - Khôi phục về nội dung mặc định
 */

const SAMPLE = {
  url: 'https://wvideos.vn/reset-password?token=mau-token-abc123',
  email: 'nguyenvietmanh1409@gmail.com',
  name: 'Mạnh Nguyễn',
  minutes: '30',
};

interface TemplateEditorState {
  subject: string;
  body: string;
}

export default function AdminEmailTemplatesPage() {
  const { user, mounted } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.name === 'ADMIN');

  const [templates, setTemplates] = useState<EmailTemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editors, setEditors] = useState<Record<string, TemplateEditorState>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailTemplateApi.getAll();
      setTemplates(data ?? []);
      const editorMap: Record<string, TemplateEditorState> = {};
      (data ?? []).forEach((t) => {
        editorMap[t.templateKey] = { subject: t.subject, body: t.body };
      });
      setEditors(editorMap);
    } catch {
      setError('Không tải được danh sách email template');
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

  const updateEditor = (key: string, field: keyof TemplateEditorState, value: string) => {
    setEditors((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSave = async (key: string) => {
    const editor = editors[key];
    if (!editor || savingKey) return;

    if (!editor.subject.trim()) {
      setError('Tiêu đề email không được để trống');
      return;
    }
    if (!editor.body.includes('{{url}}')) {
      setError('Nội dung email phải chứa placeholder {{url}} để người nhận nhận được link');
      return;
    }

    setSavingKey(key);
    setError(null);
    try {
      const updated = await emailTemplateApi.update(key, {
        subject: editor.subject.trim(),
        body: editor.body,
      });
      setTemplates((prev) => prev.map((t) => (t.templateKey === key ? updated : t)));
      showFeedback('Đã lưu email template');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Lưu thất bại, thử lại');
    } finally {
      setSavingKey(null);
    }
  };

  const handleReset = async (key: string) => {
    if (savingKey) return;
    setSavingKey(key);
    setError(null);
    try {
      const restored = await emailTemplateApi.reset(key);
      setTemplates((prev) => prev.map((t) => (t.templateKey === key ? restored : t)));
      setEditors((prev) => ({
        ...prev,
        [key]: { subject: restored.subject, body: restored.body },
      }));
      showFeedback('Đã khôi phục về nội dung mặc định');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Khôi phục thất bại, thử lại');
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
      <main className='flex-1 w-full max-w-5xl mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold text-foreground mb-1'>Quản lý nội dung email</h1>
        <p className='text-sm text-foreground opacity-60 mb-6'>
          Chỉnh sửa tiêu đề và nội dung HTML của email hệ thống. Placeholder sẽ được thay bằng giá trị
          thực khi gửi.
        </p>

        {/* Gợi ý placeholder */}
        <div className='mb-6 p-4 rounded-xl border border-secondary bg-secondary text-sm'>
          <p className='font-semibold text-foreground mb-2'>Placeholder khả dụng</p>
          <div className='flex flex-wrap gap-2'>
            {EMAIL_TEMPLATE_PLACEHOLDERS.map((p) => (
              <span
                key={p.key}
                title={p.label}
                className='px-2 py-1 rounded-lg bg-primary font-mono text-xs text-accent border border-accent/40'
              >
                {p.key}
              </span>
            ))}
          </div>
        </div>

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
            {templates.map((t) => {
              const meta = EMAIL_TEMPLATE_LABELS[t.templateKey] ?? {
                title: t.templateKey,
                description: '',
              };
              const editor = editors[t.templateKey] ?? { subject: t.subject, body: t.body };
              return (
                <div
                  key={t.templateKey}
                  className='rounded-xl border border-secondary bg-secondary overflow-hidden'
                >
                  {/* Header thẻ */}
                  <div className='flex items-center justify-between px-5 py-3 border-b border-secondary'>
                    <div>
                      <h2 className='font-semibold text-foreground'>{meta.title}</h2>
                      <p className='text-xs text-foreground opacity-60'>{meta.description}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        t.customized
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-foreground opacity-70'
                      }`}
                    >
                      {t.customized ? 'Đã tùy chỉnh' : 'Mặc định'}
                    </span>
                  </div>

                  <div className='p-5 space-y-3'>
                    {/* Tiêu đề */}
                    <div>
                      <label className='block text-xs font-medium text-foreground opacity-70 mb-1'>
                        Tiêu đề email
                      </label>
                      <input
                        type='text'
                        value={editor.subject}
                        onChange={(e) => updateEditor(t.templateKey, 'subject', e.target.value)}
                        className='w-full px-3 py-2 rounded-lg bg-primary border border-secondary text-foreground text-sm focus:outline-none focus:border-accent'
                        disabled={savingKey === t.templateKey}
                      />
                    </div>

                    {/* Nội dung HTML */}
                    <div>
                      <label className='block text-xs font-medium text-foreground opacity-70 mb-1'>
                        Nội dung HTML
                      </label>
                      <textarea
                        value={editor.body}
                        onChange={(e) => updateEditor(t.templateKey, 'body', e.target.value)}
                        rows={12}
                        className='w-full px-3 py-2 rounded-lg bg-primary border border-secondary text-foreground text-xs font-mono leading-relaxed focus:outline-none focus:border-accent'
                        disabled={savingKey === t.templateKey}
                      />
                    </div>

                    {/* Preview */}
                    {previewKey === t.templateKey && (
                      <div className='border border-secondary rounded-lg overflow-hidden bg-white'>
                        <div className='px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs text-foreground opacity-70 flex items-center justify-between'>
                          <span>Xem trước (dữ liệu mẫu)</span>
                          <button
                            type='button'
                            onClick={() => setPreviewKey(null)}
                            className='text-accent hover:underline'
                          >
                            Đóng
                          </button>
                        </div>
                        <iframe
                          title={`preview-${t.templateKey}`}
                          srcDoc={renderPreview(editor.body, SAMPLE)}
                          className='w-full h-[480px] border-0'
                        />
                      </div>
                    )}

                    {/* Nút hành động */}
                    <div className='flex items-center gap-3 pt-1'>
                      <button
                        type='button'
                        onClick={() => handleSave(t.templateKey)}
                        disabled={savingKey === t.templateKey}
                        className='px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {savingKey === t.templateKey ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          setPreviewKey(previewKey === t.templateKey ? null : t.templateKey)
                        }
                        className='px-4 py-2 rounded-lg border border-secondary text-foreground text-sm hover:border-accent transition-colors'
                      >
                        {previewKey === t.templateKey ? 'Ẩn xem trước' : 'Xem trước'}
                      </button>
                      {t.customized && (
                        <button
                          type='button'
                          onClick={() => handleReset(t.templateKey)}
                          disabled={savingKey === t.templateKey}
                          className='px-4 py-2 rounded-lg border border-red-400/60 text-red-500 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50'
                        >
                          Khôi phục mặc định
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
