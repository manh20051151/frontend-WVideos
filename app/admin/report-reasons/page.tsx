'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import reportApi, {
  DEFAULT_REASON_ICON,
  type ReportReasonItem,
  type ReportReasonPayload,
} from '@/lib/apis/report.api';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Trang quản trị: CRUD lý do báo cáo video
 * - Thêm lý do mới (code unique, không đổi được sau khi tạo)
 * - Sửa nhãn / icon SVG / thứ tự / ẩn-hiện
 * - Xóa (bị chặn nếu lý do đã dùng trong báo cáo - hãy ẩn thay vì xóa)
 */

interface ReasonFormState {
  id: number | null; // null = tạo mới
  code: string;
  label: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: ReasonFormState = {
  id: null,
  code: '',
  label: '',
  icon: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminReportReasonsPage() {
  const { user, mounted } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.name === 'ADMIN');

  const [reasons, setReasons] = useState<ReportReasonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ReasonFormState | null>(null); // null = đóng modal
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportApi.getAllReasons(0, 100);
      setReasons(data.content ?? []);
    } catch {
      setReasons([]);
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

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, sortOrder: reasons.length + 1 });
    setFormError(null);
  };

  const openEdit = (r: ReportReasonItem) => {
    setForm({
      id: r.id,
      code: r.code,
      label: r.label,
      icon: r.icon || '',
      sortOrder: r.sortOrder,
      isActive: r.isActive,
    });
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form || saving) return;
    if (!form.label.trim()) {
      setFormError('Nhãn hiển thị không được để trống');
      return;
    }
    if (form.id === null && !/^[A-Z0-9_]{2,50}$/.test(form.code.trim())) {
      setFormError('Mã lý do chỉ gồm chữ hoa, số và dấu gạch dưới (2-50 ký tự), VD: SPAM');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: ReportReasonPayload = {
        label: form.label.trim(),
        icon: form.icon.trim() || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (form.id === null) {
        await reportApi.createReason({ ...payload, code: form.code.trim().toUpperCase() });
        showFeedback('Đã thêm lý do báo cáo');
      } else {
        await reportApi.updateReason(form.id, payload);
        showFeedback('Đã cập nhật lý do báo cáo');
      }
      setForm(null);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message || 'Lưu thất bại, thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: ReportReasonItem) => {
    if (!window.confirm(`Xóa lý do "${r.label}"?`)) return;
    try {
      await reportApi.deleteReason(r.id);
      showFeedback('Đã xóa lý do báo cáo');
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Xóa thất bại, thử lại');
    }
  };

  // Bật/tắt kích hoạt nhanh
  const handleToggleActive = async (r: ReportReasonItem) => {
    try {
      await reportApi.updateReason(r.id, {
        label: r.label,
        icon: r.icon || undefined,
        sortOrder: r.sortOrder,
        isActive: !r.isActive,
      });
      showFeedback(!r.isActive ? 'Đã hiển thị lý do' : 'Đã ẩn lý do');
      await load();
    } catch {
      alert('Cập nhật thất bại, thử lại');
    }
  };

  if (mounted && !isAdmin) {
    return (
      <>
        <Header />
        <main className='min-h-screen bg-primary flex items-center justify-center'>
          <p className='text-foreground opacity-70'>Bạn không có quyền truy cập trang này</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className='min-h-screen bg-primary'>
        <div className='mx-auto max-w-4xl px-4 py-8'>
          {/* Tiêu đề */}
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div>
              <h1 className='text-2xl font-bold text-foreground'>Lý do báo cáo video</h1>
              <p className='mt-1 text-sm text-foreground opacity-60'>
                Quản lý danh sách lý do hiển thị trong modal báo cáo video
              </p>
            </div>
            <button
              onClick={openCreate}
              className='px-4 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity'
            >
              + Thêm lý do
            </button>
          </div>

          {/* Danh sách */}
          <div className='mt-6 space-y-3'>
            {loading ? (
              Array.from({ length: 4 }, (_, i) => (
                <div key={i} className='h-16 rounded-xl bg-secondary animate-pulse' />
              ))
            ) : reasons.length === 0 ? (
              <p className='text-center py-12 text-foreground opacity-60'>Chưa có lý do báo cáo nào</p>
            ) : (
              reasons.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    r.isActive ? 'border-secondary hover:border-accent/50' : 'border-dashed border-secondary opacity-60'
                  }`}
                >
                  {/* Icon */}
                  <span className='w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-accent' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' d={r.icon || DEFAULT_REASON_ICON} />
                    </svg>
                  </span>

                  {/* Nội dung */}
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-foreground truncate'>{r.label}</p>
                    <p className='text-xs text-foreground opacity-50'>
                      Mã: <span className='font-mono'>{r.code}</span> • Thứ tự: {r.sortOrder}
                      {!r.isActive && ' • Đã ẩn'}
                    </p>
                  </div>

                  {/* Hành động */}
                  <div className='flex items-center gap-1.5 flex-shrink-0'>
                    <button
                      onClick={() => handleToggleActive(r)}
                      title={r.isActive ? 'Ẩn khỏi modal báo cáo' : 'Hiện lại trong modal báo cáo'}
                      className='px-3 py-1.5 rounded-full border border-secondary text-foreground text-xs font-medium hover:border-accent transition-colors'
                    >
                      {r.isActive ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      onClick={() => openEdit(r)}
                      className='px-3 py-1.5 rounded-full border border-secondary text-foreground text-xs font-medium hover:border-accent transition-colors'
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      title='Xóa (không thể xóa nếu đã có báo cáo dùng lý do này)'
                      className='px-3 py-1.5 rounded-full border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal thêm / sửa lý do */}
      {form && (
        <div
          className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
          onClick={(e) => e.target === e.currentTarget && setForm(null)}
        >
          <div className='w-full max-w-md bg-primary rounded-2xl shadow-2xl border border-secondary max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-secondary'>
              <h3 className='font-bold text-foreground'>{form.id === null ? 'Thêm lý do báo cáo' : 'Sửa lý do báo cáo'}</h3>
              <button
                onClick={() => setForm(null)}
                className='p-1.5 rounded-full text-foreground hover:bg-secondary transition-colors'
                aria-label='Đóng'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <div className='px-5 py-4 space-y-4'>
              {/* Mã (chỉ nhập khi tạo mới) */}
              <div>
                <label className='block text-sm font-medium text-foreground mb-1.5'>
                  Mã lý do <span className='opacity-50'>(không đổi được sau khi tạo)</span>
                </label>
                <input
                  type='text'
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={form.id !== null}
                  placeholder='VD: SPAM, COPYRIGHT, MISLEADING'
                  className='w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-mono placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent disabled:opacity-50'
                />
              </div>

              {/* Nhãn hiển thị */}
              <div>
                <label className='block text-sm font-medium text-foreground mb-1.5'>
                  Nhãn hiển thị <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder='VD: Spam / quảng cáo lừa đảo'
                  maxLength={255}
                  className='w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent'
                />
              </div>

              {/* Icon SVG path */}
              <div>
                <label className='block text-sm font-medium text-foreground mb-1.5'>
                  Icon (SVG path data, tùy chọn)
                </label>
                <textarea
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder='Dữ liệu path của SVG, VD: M12 2a10 10 0 100 20...'
                  rows={2}
                  className='w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-mono placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent resize-none'
                />
                {/* Xem trước icon */}
                <div className='mt-2 flex items-center gap-2 text-xs text-foreground opacity-60'>
                  Xem trước:
                  <span className='w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center'>
                    <svg className='w-4 h-4 text-accent' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' d={form.icon.trim() || DEFAULT_REASON_ICON} />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Thứ tự + kích hoạt */}
              <div className='flex items-center gap-4'>
                <div className='flex-1'>
                  <label className='block text-sm font-medium text-foreground mb-1.5'>Thứ tự hiển thị</label>
                  <input
                    type='number'
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className='w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-accent'
                  />
                </div>
                <label className='flex items-center gap-2.5 mt-6 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className='w-4 h-4 accent-accent'
                  />
                  <span className='text-sm text-foreground'>Hiện trong modal báo cáo</span>
                </label>
              </div>

              {formError && <p className='text-sm text-red-500'>{formError}</p>}

              <div className='flex items-center justify-end gap-2.5 pt-1'>
                <button
                  onClick={() => setForm(null)}
                  className='px-4 py-2.5 rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors'
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className='px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity'
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {feedback && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-black/85 text-white px-5 py-2.5 rounded-full text-sm shadow-lg'>
          {feedback}
        </div>
      )}
    </>
  );
}
