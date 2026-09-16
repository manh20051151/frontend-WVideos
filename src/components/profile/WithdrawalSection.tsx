'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { withdrawalApi, MIN_WITHDRAWAL_AMOUNT, type WithdrawalStatus } from '@/lib/apis/withdrawal.api';

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value ?? 0) + '₫';

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const STATUS_META: Record<WithdrawalStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700 border-green-300' },
  REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-700 border-red-300' },
};

export default function WithdrawalSection({ isDark }: { isDark?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const revenue = user?.revenue ?? 0;
  const hasBankInfo = !!user?.bankName && !!user?.bankAccountHolderName && !!user?.bankAccountNumber;

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['myWithdrawals'],
    queryFn: withdrawalApi.getMyWithdrawals,
  });

  const hasPending = (withdrawals ?? []).some((w) => w.status === 'PENDING');

  const createMutation = useMutation({
    mutationFn: (value: number) => withdrawalApi.createMyWithdrawal(value),
    onSuccess: () => {
      setSuccess('Gửi yêu cầu rút tiền thành công! Vui lòng chờ admin xử lý.');
      setAmount('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['myWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['financialHistory'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      setSuccess('');
      setError(message);
    },
  });

  const parsedAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;

  const handleSubmit = () => {
    setError('');
    setSuccess('');
    if (!hasBankInfo) {
      setError('Vui lòng cập nhật thông tin ngân hàng, tên chủ tài khoản và số tài khoản trong mục Thông tin cá nhân.');
      return;
    }
    if (hasPending) {
      setError('Bạn đang có yêu cầu rút tiền chưa được xử lý.');
      return;
    }
    if (revenue < MIN_WITHDRAWAL_AMOUNT) {
      setError(`Doanh thu hiện tại chưa đạt mức tối thiểu ${formatVnd(MIN_WITHDRAWAL_AMOUNT)}.`);
      return;
    }
    if (parsedAmount < MIN_WITHDRAWAL_AMOUNT) {
      setError(`Số tiền rút tối thiểu là ${formatVnd(MIN_WITHDRAWAL_AMOUNT)}.`);
      return;
    }
    if (parsedAmount > revenue) {
      setError('Số tiền rút không được vượt quá doanh thu hiện tại.');
      return;
    }
    createMutation.mutate(parsedAmount);
  };

  const inputClass = `w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-700'}`;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <h3 className="text-sm font-semibold text-foreground mb-3">Yêu cầu rút tiền</h3>

      <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex flex-wrap gap-4 justify-between text-sm">
          <div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Doanh thu hiện tại</p>
            <p className="font-semibold text-green-600">{formatVnd(revenue)}</p>
          </div>
          <div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Tối thiểu để rút</p>
            <p className="font-semibold text-foreground">{formatVnd(MIN_WITHDRAWAL_AMOUNT)}</p>
          </div>
          <div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Thông tin ngân hàng</p>
            <p className={`font-semibold ${hasBankInfo ? 'text-green-600' : 'text-red-500'}`}>
              {hasBankInfo ? 'Đã cập nhật' : 'Chưa cập nhật'}
            </p>
          </div>
        </div>
      </div>

      {hasBankInfo && (
        <div className={`rounded-xl p-4 mb-4 text-sm ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            <span className="font-medium text-foreground">{user?.bankAccountHolderName}</span>
            {' · '}
            {user?.bankAccountNumber}
          </p>
        </div>
      )}

      {hasPending && (
        <div className={`mb-4 p-3 rounded-lg border text-sm ${isDark ? 'bg-yellow-500/10 border-yellow-600/40 text-yellow-400' : 'bg-yellow-50 border-yellow-300 text-yellow-700'}`}>
          Bạn đang có yêu cầu rút tiền chưa được xử lý. Vui lòng chờ admin xử lý trước khi tạo yêu cầu mới.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Nhập số tiền muốn rút (VNĐ)"
          disabled={hasPending || createMutation.isPending}
          className={`${inputClass} ${hasPending ? 'cursor-not-allowed opacity-60' : ''}`}
        />
        <button
          onClick={handleSubmit}
          disabled={hasPending || createMutation.isPending || !hasBankInfo}
          className="px-6 py-3 rounded-lg font-medium btn-accent whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </div>

      {error && <div className="mt-3 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">{error}</div>}
      {success && <div className="mt-3 p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">{success}</div>}

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">Lịch sử yêu cầu rút tiền</h4>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`animate-pulse h-16 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
            ))}
          </div>
        ) : (withdrawals ?? []).length === 0 ? (
          <div className={`py-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Chưa có yêu cầu rút tiền nào
          </div>
        ) : (
          <ul className="space-y-2">
            {(withdrawals ?? []).map((w) => {
              const meta = STATUS_META[w.status];
              return (
                <li
                  key={w.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground tabular-nums">{formatVnd(w.amount)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDateTime(w.createdAt)}
                    </p>
                    {w.adminNote && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ghi chú: {w.adminNote}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${meta.className}`}>
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}