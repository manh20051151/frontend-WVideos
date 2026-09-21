'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import reportApi, {
  REPORT_STATUS_LABELS,
  type ReportReasonItem,
  type VideoReportResponse,
} from '@/lib/apis/report.api';
import Pagination from '@/components/common/Pagination';

/**
 * Tab "Báo cáo của tôi" trong trang profile:
 * - Danh sách báo cáo user đã gửi kèm trạng thái xử lý
 * - Rút lại báo cáo đang chờ xử lý (rút rồi có thể báo cáo lại video)
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

const StatusBadge = ({ status }: { status: VideoReportResponse['status'] }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    DISMISSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status] ?? ''}`}>
      {REPORT_STATUS_LABELS[status] ?? status}
    </span>
  );
};

export default function ReportsTab() {
  const [reports, setReports] = useState<VideoReportResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

  // Map code -> nhãn lý do (dùng danh sách public; lý do đã ẩn sẽ fallback hiển thị code)
  useEffect(() => {
    reportApi
      .getActiveReasons()
      .then((list: ReportReasonItem[]) => {
        const map: Record<string, string> = {};
        list.forEach((r) => {
          map[r.code] = r.label;
        });
        setReasonMap(map);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportApi.getMyReports(page, PAGE_SIZE);
      setReports(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      setReports([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = async (reportId: number) => {
    if (withdrawingId) return;
    if (!window.confirm('Rút lại báo cáo này? Bạn sẽ có thể báo cáo lại video sau này.')) return;
    setWithdrawingId(reportId);
    try {
      await reportApi.withdrawReport(reportId);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Không rút được báo cáo, thử lại sau');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className='flex gap-4 p-4 rounded-xl border border-secondary animate-pulse'>
            <div className='w-28 h-16 rounded-lg bg-secondary flex-shrink-0' />
            <div className='flex-1 space-y-2.5 py-1'>
              <div className='h-4 rounded w-2/3' />
              <div className='h-3 rounded w-1/3' />
              <div className='h-3 rounded w-1/2' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className='text-center py-16'>
        <div className='w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4'>
          <svg className='w-8 h-8 text-foreground opacity-30' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5' />
          </svg>
        </div>
        <p className='font-medium text-foreground'>Chưa có báo cáo nào</p>
        <p className='mt-1 text-sm text-foreground opacity-60'>
          Khi bạn báo cáo một video vi phạm, báo cáo sẽ xuất hiện tại đây
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {reports.map((r) => (
        <div key={r.id} className='p-4 rounded-xl border border-secondary hover:border-accent/50 transition-colors'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* Video bị báo cáo */}
            <Link href={`/watch/${r.videoSlug || r.videoId}`} className='flex gap-3 sm:w-72 flex-shrink-0 group'>
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

            {/* Chi tiết báo cáo */}
            <div className='flex-1 min-w-0 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium whitespace-nowrap'>
                  {reasonMap[r.reason] || r.reason}
                </span>
                <StatusBadge status={r.status} />
              </div>
              {r.description && (
                <p className='text-sm text-foreground opacity-80 line-clamp-2'>&ldquo;{r.description}&rdquo;</p>
              )}
              {r.status === 'RESOLVED' && (
                <p className='text-xs text-emerald-600 dark:text-emerald-400'>
                  Quản trị viên đã xem xét và xử lý báo cáo của bạn
                  {r.resolvedAt && ` • ${formatDateTime(r.resolvedAt)}`}
                </p>
              )}
              {r.status === 'DISMISSED' && (
                <p className='text-xs text-foreground opacity-50'>
                  Quản trị viên đã xem xét và bỏ qua báo cáo này
                  {r.adminNote && (
                    <>
                      {' — '}
                      <span className='italic'>&ldquo;{r.adminNote}&rdquo;</span>
                    </>
                  )}
                  {r.resolvedAt && ` • ${formatDateTime(r.resolvedAt)}`}
                </p>
              )}
            </div>

            {/* Rút lại báo cáo đang chờ */}
            {r.status === 'PENDING' && (
              <div className='flex items-end justify-end flex-shrink-0'>
                <button
                  onClick={() => handleWithdraw(r.id)}
                  disabled={withdrawingId === r.id}
                  className='px-4 py-2 rounded-full border border-secondary text-foreground text-xs font-medium disabled:opacity-40 hover:border-red-400 hover:text-red-500 transition-colors whitespace-nowrap'
                >
                  {withdrawingId === r.id ? 'Đang rút...' : 'Rút lại'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(Math.max(0, p))} />
    </div>
  );
}
