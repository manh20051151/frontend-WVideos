'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/common/Pagination';
import { withdrawalApi, type WithdrawalResponse, type WithdrawalStatus } from '@/lib/apis/withdrawal.api';

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value ?? 0) + '₫';

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const STATUS_META: Record<WithdrawalStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-700' },
};

const FILTERS: { key: '' | WithdrawalStatus; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xử lý' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

const PAGE_SIZE = 10;

export default function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'' | WithdrawalStatus>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<WithdrawalResponse | null>(null);
  const [action, setAction] = useState<WithdrawalStatus>('APPROVED');
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminWithdrawals', page, filter],
    queryFn: () => withdrawalApi.getWithdrawals(page, PAGE_SIZE, filter || undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: WithdrawalStatus; note?: string }) =>
      withdrawalApi.updateStatus(id, status, note),
    onSuccess: () => {
      setSuccess('Cập nhật trạng thái thành công!');
      setError('');
      setProcessing(null);
      setAdminNote('');
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      refetch();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Cập nhật thất bại. Vui lòng thử lại.';
      setSuccess('');
      setError(message);
    },
  });

  const handleFilterChange = (key: '' | WithdrawalStatus) => {
    setFilter(key);
    setPage(0);
  };

  const handleConfirm = () => {
    if (!processing) return;
    updateMutation.mutate({ id: processing.id, status: action, note: adminNote || undefined });
  };

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">💰 Yêu c��u rút tiền</h1>
            <p className="mt-2 text-foreground opacity-70">Duyệt hoặc từ chối các yêu cầu rút tiền của người dùng</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key || 'all'}
                onClick={() => handleFilterChange(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'btn-accent'
                    : 'bg-secondary text-foreground border border-accent hover:bg-accent/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">{success}</div>}

          <div className="bg-secondary rounded-xl border border-accent overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary text-foreground">
                  <tr>
                    <th className="text-left p-3">Người dùng</th>
                    <th className="text-right p-3">Số tiền</th>
                    <th className="text-left p-3">Ngân hàng</th>
                    <th className="text-left p-3">Trạng thái</th>
                    <th className="text-left p-3">Ngày tạo</th>
                    <th className="text-right p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="p-6 text-center text-foreground opacity-60">Đang tải...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-foreground opacity-60">Chưa có yêu cầu nào</td></tr>
                  ) : (
                    items.map((w) => {
                      const meta = STATUS_META[w.status];
                      return (
                        <tr key={w.id} className="border-t border-accent/30">
                          <td className="p-3">
                            <p className="font-medium text-foreground">{w.userFullName || '—'}</p>
                            <p className="text-xs text-foreground opacity-60">{w.userEmail}</p>
                          </td>
                          <td className="p-3 text-right font-semibold text-foreground tabular-nums">{formatVnd(w.amount)}</td>
                          <td className="p-3">
                            <p className="text-foreground">{w.bankName}</p>
                            <p className="text-xs text-foreground opacity-60">{w.bankAccountHolderName} · {w.bankAccountNumber}</p>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>
                            {w.adminNote && <p className="text-xs text-foreground opacity-60 mt-1">{w.adminNote}</p>}
                          </td>
                          <td className="p-3 text-foreground opacity-70 whitespace-nowrap">{formatDateTime(w.createdAt)}</td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {w.status === 'PENDING' ? (
                              <button
                                onClick={() => { setProcessing(w); setAction('APPROVED'); setAdminNote(''); setError(''); setSuccess(''); }}
                                className="text-accent hover:underline font-medium"
                              >
                                Xử lý
                              </button>
                            ) : (
                              <span className="text-foreground opacity-50 text-xs">Đã xử lý</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setProcessing(null)} />
          <div className="relative bg-secondary rounded-2xl shadow-2xl w-full max-w-md border border-accent" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-accent/40">
              <h3 className="text-lg font-semibold text-foreground">Xử lý yêu cầu rút tiền</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm space-y-1">
                <p className="text-foreground"><span className="opacity-60">Người dùng:</span> {processing.userFullName || processing.userEmail}</p>
                <p className="text-foreground"><span className="opacity-60">Số tiền:</span> <span className="font-semibold">{formatVnd(processing.amount)}</span></p>
                <p className="text-foreground"><span className="opacity-60">Ngân hàng:</span> {processing.bankName}</p>
                <p className="text-foreground"><span className="opacity-60">Chủ TK:</span> {processing.bankAccountHolderName}</p>
                <p className="text-foreground"><span className="opacity-60">Số TK:</span> {processing.bankAccountNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Quyết định</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={action === 'APPROVED'} onChange={() => setAction('APPROVED')} className="w-4 h-4 text-accent" />
                    <span className="text-foreground">Duyệt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={action === 'REJECTED'} onChange={() => setAction('REJECTED')} className="w-4 h-4 text-accent" />
                    <span className="text-foreground">Từ chối</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Ghi chú (tùy chọn)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Lý do hoặc ghi chú xử lý..."
                  className="w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground resize-none"
                />
              </div>

              {action === 'APPROVED' && (
                <p className="text-xs text-yellow-600">Duyệt sẽ trừ {formatVnd(processing.amount)} khỏi doanh thu của người dùng.</p>
              )}

              {error && <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">{error}</div>}
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setProcessing(null)} className="px-4 py-2 rounded-lg border border-accent text-foreground">Hủy</button>
              <button
                onClick={handleConfirm}
                disabled={updateMutation.isPending}
                className="btn-accent px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}