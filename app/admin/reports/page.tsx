'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import reportApi, {
  REPORT_STATUS_LABELS,
  type ReportReasonItem,
  type ReportStatus,
  type VideoReportResponse,
} from '@/lib/apis/report.api';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Trang quản trị: quản lý báo cáo vi phạm video
 * - Tabs: Tất cả / Chờ xử lý / Đã xử lý / Đã bỏ qua (kèm số lượng)
 * - Hành động: đánh dấu đã xử lý (RESOLVED) hoặc bỏ qua (DISMISSED)
 */

const PAGE_SIZE = 10;

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusBadge = ({ status }: { status: ReportStatus }) => {
  const styles: Record<ReportStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    DISMISSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status]}`}>
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
};

const ReasonBadge = ({
  reason,
  labelMap,
}: {
  reason: VideoReportResponse['reason'];
  labelMap: Record<string, string>;
}) => (
  <span className='px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium whitespace-nowrap'>
    {labelMap[reason] || reason}
  </span>
);

export default function AdminReportsPage() {
  const { user, mounted } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | null>(null);
  const [reports, setReports] = useState<VideoReportResponse[]>([]);
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({ PENDING: 0, RESOLVED: 0, DISMISSED: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  // Modal nhập lý do bỏ qua báo cáo
  const [dismissTarget, setDismissTarget] = useState<VideoReportResponse | null>(null);
  const [dismissNote, setDismissNote] = useState('');
  const [dismissError, setDismissError] = useState<string | null>(null);

  const isAdmin = user?.roles?.some((r) => r.name === 'ADMIN');

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await reportApi.getCounts());
    } catch {
      // im lặng
    }
  }, []);

  // Tải map code -> nhãn lý do báo cáo (kể cả lý do đã ẩn để hiển thị đúng báo cáo cũ)
  const loadReasonMap = useCallback(async () => {
    try {
      const data = await reportApi.getAllReasons(0, 100);
      const map: Record<string, string> = {};
      (data.content ?? []).forEach((r) => {
        map[r.code] = r.label;
      });
      setReasonMap(map);
    } catch {
      // im lặng - fallback hiển thị code thô
    }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportApi.getReports(statusFilter ?? undefined, page, PAGE_SIZE);
      setReports(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (mounted && isAdmin) {
      loadReports();
      loadCounts();
      loadReasonMap();
    }
  }, [mounted, isAdmin, loadReports, loadCounts, loadReasonMap]);

  // Đổi filter -> về trang 1
  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId: number, status: 'RESOLVED' | 'DISMISSED', adminNote?: string) => {
    if (processingId) return;
    setProcessingId(reportId);
    try {
      await reportApi.updateReportStatus(reportId, status, adminNote);
      setFeedback(status === 'RESOLVED' ? 'Đã đánh dấu xử lý' : 'Đã bỏ qua báo cáo');
      setTimeout(() => setFeedback(null), 2500);
      await Promise.all([loadReports(), loadCounts()]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Cập nhật thất bại, thử lại');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolve = async (reportId: number) => {
    if (!window.confirm('Đánh dấu báo cáo này là đã xử lý?')) return;
    await handleUpdateStatus(reportId, 'RESOLVED');
  };

  // Mở modal nhập lý do bỏ qua
  const openDismissModal = (report: VideoReportResponse) => {
    setDismissTarget(report);
    setDismissNote('');
    setDismissError(null);
  };

  // Xác nhận bỏ qua kèm lý do (bắt buộc)
  const confirmDismiss = async () => {
    if (!dismissTarget || processingId) return;
    const note = dismissNote.trim();
    if (!note) {
      setDismissError('Vui lòng nhập lý do bỏ qua báo cáo');
      return;
    }
    await handleUpdateStatus(dismissTarget.id, 'DISMISSED', note);
    setDismissTarget(null);
  };

  const tabs: { key: ReportStatus | null; label: string; count: number }[] = [
    { key: null, label: 'Tất cả', count: (counts.PENDING ?? 0) + (counts.RESOLVED ?? 0) + (counts.DISMISSED ?? 0) },
    { key: 'PENDING', label: 'Chờ xử lý', count: counts.PENDING ?? 0 },
    { key: 'RESOLVED', label: 'Đã xử lý', count: counts.RESOLVED ?? 0 },
    { key: 'DISMISSED', label: 'Đã bỏ qua', count: counts.DISMISSED ?? 0 },
  ];

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
        <div className='mx-auto max-w-6xl px-4 py-8'>
          {/* Tiêu đề */}
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div>
              <h1 className='text-2xl font-bold text-foreground'>Quản lý báo cáo video</h1>
              <p className='mt-1 text-sm text-foreground opacity-60'>
                Xem xét các báo cáo vi phạm do người dùng gửi
              </p>
            </div>
            {counts.PENDING > 0 && (
              <span className='px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-sm font-semibold'>
                {counts.PENDING} báo cáo chờ xử lý
              </span>
            )}
          </div>

          {/* Tabs lọc trạng thái */}
          <div className='mt-6 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1'>
            {tabs.map((t) => (
              <button
                key={t.label}
                onClick={() => setStatusFilter(t.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === t.key
                    ? 'bg-accent text-white shadow-md shadow-accent/30'
                    : 'bg-secondary text-foreground opacity-75 hover:opacity-100'
                }`}
              >
                {t.label} <span className='opacity-70'>({t.count})</span>
              </button>
            ))}
          </div>

          {/* Danh sách báo cáo */}
          <div className='mt-6 space-y-4'>
            {loading ? (
              Array.from({ length: 4 }, (_, i) => (
                <div key={i} className='flex gap-4 p-4 rounded-xl border border-secondary animate-pulse'>
                  <div className='w-32 h-20 rounded-lg bg-secondary flex-shrink-0' />
                  <div className='flex-1 space-y-2.5 py-1'>
                    <div className='h-4 rounded w-2/3' />
                    <div className='h-3 rounded w-1/3' />
                    <div className='h-3 rounded w-1/2' />
                  </div>
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className='text-center py-16'>
                <p className='text-foreground opacity-60'>Chưa có báo cáo nào ở mục này</p>
              </div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className='p-4 rounded-xl border border-secondary hover:border-accent/50 transition-colors'>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    {/* Thumbnail + tiêu đề video */}
                    <Link
                      href={`/watch/${r.videoSlug || r.videoId}`}
                      className='flex gap-3 sm:w-72 flex-shrink-0 group'
                    >
                      <div className='w-28 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0'>
                        {r.videoThumbnailUrl ? (
                          <img src={r.videoThumbnailUrl} alt='' className='w-full h-full object-cover' />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center text-xl opacity-40'>🎬</div>
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors'>
                          {r.videoTitle || `Video đã bị xóa (${r.videoId.slice(0, 8)}...)`}
                        </p>
                        <p className='mt-1 text-xs text-foreground opacity-50'>{formatDateTime(r.createdAt)}</p>
                      </div>
                    </Link>

                    {/* Thông tin báo cáo */}
                    <div className='flex-1 min-w-0 space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <ReasonBadge reason={r.reason} labelMap={reasonMap} />
                        <StatusBadge status={r.status} />
                      </div>
                      {r.description && (
                        <p className='text-sm text-foreground opacity-80 line-clamp-3'>&ldquo;{r.description}&rdquo;</p>
                      )}
                      <p className='text-xs text-foreground opacity-50 truncate'>
                        Người báo cáo: {r.reporterName || 'Ẩn danh'} {r.reporterEmail && `(${r.reporterEmail})`}
                      </p>
                      {r.adminNote && (
                        <p className='text-xs text-accent opacity-80 truncate'>Ghi chú: {r.adminNote}</p>
                      )}
                    </div>

                    {/* Hành động */}
                    {r.status === 'PENDING' && (
                      <div className='flex sm:flex-col gap-2 justify-end flex-shrink-0'>
                        <button
                          onClick={() => handleResolve(r.id)}
                          disabled={processingId === r.id}
                          className='px-4 py-2 rounded-full bg-accent text-white text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-opacity whitespace-nowrap'
                        >
                          ✓ Đã xử lý
                        </button>
                        <button
                          onClick={() => openDismissModal(r)}
                          disabled={processingId === r.id}
                          className='px-4 py-2 rounded-full border border-secondary text-foreground text-xs font-medium disabled:opacity-40 hover:border-accent transition-colors whitespace-nowrap'
                        >
                          Bỏ qua
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Phân trang */}
          {!loading && totalPages > 1 && (
            <div className='mt-8 flex items-center justify-center gap-3'>
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                className='px-4 py-2 rounded-full border border-secondary text-sm text-foreground disabled:opacity-40 hover:border-accent transition-colors'
              >
                ← Trước
              </button>
              <span className='text-sm text-foreground opacity-70'>
                Trang {page + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className='px-4 py-2 rounded-full border border-secondary text-sm text-foreground disabled:opacity-40 hover:border-accent transition-colors'
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Modal nhập lý do bỏ qua báo cáo */}
      {dismissTarget && (
        <div
          className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
          onClick={(e) => e.target === e.currentTarget && setDismissTarget(null)}
        >
          <div className='w-full max-w-md bg-primary rounded-2xl shadow-2xl border border-secondary'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-secondary'>
              <h3 className='font-bold text-foreground'>Bỏ qua báo cáo</h3>
              <button
                onClick={() => setDismissTarget(null)}
                className='p-1.5 rounded-full text-foreground hover:bg-secondary transition-colors'
                aria-label='Đóng'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <div className='px-5 py-4'>
              <p className='text-sm text-foreground opacity-70'>
                Báo cáo video:{' '}
                <span className='font-medium text-foreground'>{dismissTarget.videoTitle || 'Video đã bị xóa'}</span>
              </p>
              <p className='mt-1 text-sm text-foreground opacity-70'>
                Lý do: <span className='text-accent'>{reasonMap[dismissTarget.reason] || dismissTarget.reason}</span>
              </p>
              <textarea
                value={dismissNote}
                onChange={(e) => {
                  setDismissNote(e.target.value);
                  setDismissError(null);
                }}
                placeholder='Nhập lý do bỏ qua báo cáo (bắt buộc, tối đa 1000 ký tự)...'
                rows={3}
                maxLength={1000}
                autoFocus
                className='mt-3 w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent resize-none'
              />
              {dismissError && <p className='mt-2 text-sm text-red-500'>{dismissError}</p>}
              <div className='mt-4 flex items-center justify-end gap-2.5'>
                <button
                  onClick={() => setDismissTarget(null)}
                  className='px-4 py-2.5 rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors'
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDismiss}
                  disabled={processingId === dismissTarget.id}
                  className='px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity'
                >
                  {processingId === dismissTarget.id ? 'Đang xử lý...' : 'Xác nhận bỏ qua'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast phản hồi */}
      {feedback && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-black/85 text-white px-5 py-2.5 rounded-full text-sm shadow-lg'>
          {feedback}
        </div>
      )}
    </>
  );
}
