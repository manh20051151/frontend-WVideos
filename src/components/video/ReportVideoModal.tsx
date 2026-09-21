'use client';

import { useEffect, useState } from 'react';
import reportApi, { DEFAULT_REASON_ICON, type ReportReasonItem } from '@/lib/apis/report.api';

/**
 * Modal báo cáo vi phạm video:
 * - Danh sách lý do lấy từ server (admin quản lý CRUD được qua /admin/report-reasons)
 * - Chọn lý do (bắt buộc) + mô tả chi tiết (tùy chọn)
 * - Trạng thái đã gửi / lỗi (trùng báo cáo, video của chính mình...)
 */

export default function ReportVideoModal({
  videoId,
  videoTitle,
  onClose,
}: {
  videoId: string;
  videoTitle?: string;
  onClose: () => void;
}) {
  const [reasons, setReasons] = useState<ReportReasonItem[]>([]);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tải danh sách lý do đang kích hoạt từ server
  useEffect(() => {
    let cancelled = false;
    reportApi
      .getActiveReasons()
      .then((data) => {
        if (!cancelled) setReasons(data);
      })
      .catch(() => {
        // Lỗi -> modal vẫn mở, sẽ hiện lỗi khi submit
      })
      .finally(() => {
        if (!cancelled) setLoadingReasons(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    if (!reasonCode || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await reportApi.reportVideo(videoId, reasonCode, description);
      setSubmitted(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Không gửi được báo cáo, thử lại sau');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className='w-full max-w-md bg-primary rounded-2xl shadow-2xl border border-secondary max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-secondary'>
          <div>
            <h3 className='font-bold text-foreground'>
              {submitted ? 'Đã gửi báo cáo' : 'Báo cáo video'}
            </h3>
            {videoTitle && (
              <p className='mt-0.5 text-xs text-foreground opacity-60 truncate max-w-[280px] sm:max-w-sm'>{videoTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className='p-1.5 rounded-full text-foreground hover:bg-secondary transition-colors'
            aria-label='Đóng'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {submitted ? (
          /* Trạng thái đã gửi thành công */
          <div className='px-5 py-8 flex flex-col items-center text-center'>
            <div className='w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center mb-4'>
              <svg className='w-7 h-7 text-accent' fill='none' stroke='currentColor' strokeWidth={2.5} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <p className='font-semibold text-foreground'>Cảm ơn bạn đã báo cáo</p>
            <p className='mt-1 text-sm text-foreground opacity-60'>
              Quản trị viên sẽ xem xét báo cáo của bạn trong thời gian sớm nhất.
            </p>
            <button
              onClick={onClose}
              className='mt-6 px-6 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity'
            >
              Đóng
            </button>
          </div>
        ) : (
          /* Form chọn lý do */
          <div className='px-5 py-4'>
            <p className='text-sm text-foreground opacity-70 mb-3'>Chọn lý do báo cáo video này:</p>

            {loadingReasons ? (
              <div className='space-y-2 py-2'>
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className='h-11 rounded-xl bg-secondary animate-pulse' />
                ))}
              </div>
            ) : (
              <div className='space-y-1.5'>
                {reasons.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border ${
                      reasonCode === r.code
                        ? 'border-accent bg-accent/10'
                        : 'border-transparent hover:bg-secondary'
                    }`}
                  >
                    <input
                      type='radio'
                      name='report-reason'
                      checked={reasonCode === r.code}
                      onChange={() => setReasonCode(r.code)}
                      className='accent-accent'
                    />
                    <svg
                      className='w-4 h-4 text-accent flex-shrink-0'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth={2}
                      viewBox='0 0 24 24'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' d={r.icon || DEFAULT_REASON_ICON} />
                    </svg>
                    <span className='text-sm text-foreground'>{r.label}</span>
                  </label>
                ))}
                {reasons.length === 0 && (
                  <p className='text-sm text-foreground opacity-60 py-2'>
                    Không tải được danh sách lý do, thử lại sau
                  </p>
                )}
              </div>
            )}

            {/* Mô tả chi tiết */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Mô tả thêm (tùy chọn, tối đa 1000 ký tự)'
              rows={3}
              maxLength={1000}
              className='mt-4 w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent resize-none'
            />

            {error && <p className='mt-3 text-sm text-red-500'>{error}</p>}

            <div className='mt-4 flex items-center justify-end gap-2.5'>
              <button
                onClick={onClose}
                className='px-4 py-2.5 rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors'
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reasonCode || submitting || loadingReasons}
                className='px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity'
              >
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
