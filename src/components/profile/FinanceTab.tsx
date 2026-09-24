'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getMyFinancialHistory, type FinancialEvent, type MonthlyStat } from '@/lib/apis/wallet.api';
import WithdrawalSection from './WithdrawalSection';

type IconProps = { className?: string };

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value ?? 0) + '₫';

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return `Th${Number(m)}/${y.slice(2)}`;
};

const EVENT_TYPE_META: Record<FinancialEvent['type'], { label: string; icon: string; color: string }> = {
  TOPUP: {
    label: 'Nạp tiền',
    icon: 'M12 19V5m0 0l-6 6m6-6l6 6', // mũi tên xuống (tiền vào ví)
    color: 'text-accent',
  },
  VIDEO_PURCHASE: {
    label: 'Mua video',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
    color: 'text-orange-500',
  },
  CREATOR_REVENUE: {
    label: 'Doanh thu',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', // đường biểu đi lên
    color: 'text-green-600',
  },
};

const ChipIcon = ({ path, className = 'w-4 h-4' }: IconProps & { path: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

// Thẻ thống kê tổng quan
function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  isDark,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone: 'accent' | 'green' | 'red' | 'neutral';
  isDark?: boolean;
}) {
  const toneClasses = {
    accent: 'bg-accent/15 text-accent',
    green: 'bg-green-500/15 text-green-600',
    red: 'bg-red-500/15 text-red-500',
    neutral: isDark ? 'bg-blue-400/15 text-blue-400' : 'bg-blue-500/15 text-blue-600',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${toneClasses}`}>
          <ChipIcon path={icon} className="w-5 h-5" />
        </div>
        <span className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      <p className="mt-3 text-xl font-bold text-foreground" title={value}>{value}</p>
      {hint && <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{hint}</p>}
    </div>
  );
}

// Định dạng rút gọn cho trục: 1,5tr / 500k / 350đ
const fmtShort = (v: number): string => {
  if (v >= 1_000_000_000) {
    const x = v / 1_000_000_000;
    return `${Number.isInteger(x) ? x : x.toFixed(1).replace('.', ',')} tỷ`;
  }
  if (v >= 1_000_000) {
    const x = v / 1_000_000;
    return `${(Number.isInteger(x) ? String(x) : x.toFixed(1)).replace('.', ',')}tr`;
  }
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${Math.round(v)}đ`;
};

// Làm tròn max lên "số đẹp" (1, 2, 2.5, 5, 10 * 10^n) để chia vạch trục tung
const niceCeil = (v: number): number => {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
};

// Biểu đồ cột nhóm theo tháng: trục tiền + tổng series + hover số liệu từng tháng
function MonthlyChart({ stats, isDark }: { stats: MonthlyStat[]; isDark?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 640;
  const H = 240;
  const padL = 50;
  const padR = 10;
  const padB = 26;
  const padT = 14;
  const innerW = W - padL - padR;
  const innerH = H - padB - padT;
  const rawMax = stats.length ? Math.max(1, ...stats.flatMap((s) => [s.deposits, s.spending, s.earnings])) : 1;
  const max = niceCeil(rawMax);
  const groupW = stats.length ? innerW / stats.length : innerW;
  const barW = Math.min(18, groupW / 4);
  const gap = 4;
  const labelStep = Math.max(1, Math.ceil(stats.length / 12)); // giãn nhãn khi nhiều tháng

  const scaleY = (v: number) => (v / max) * innerH;

  const series: { key: keyof MonthlyStat; color: string; label: string; total: number }[] = [
    { key: 'deposits', color: 'var(--color-accent)', label: 'Nạp tiền', total: stats.reduce((a, s) => a + (s.deposits || 0), 0) },
    { key: 'spending', color: isDark ? '#fb923c' : '#f97316', label: 'Chi mua', total: stats.reduce((a, s) => a + (s.spending || 0), 0) },
    { key: 'earnings', color: isDark ? '#4ade80' : '#16a34a', label: 'Doanh thu', total: stats.reduce((a, s) => a + (s.earnings || 0), 0) },
  ];

  const hovered = hover !== null ? stats[hover] : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-60" onMouseLeave={() => setHover(null)}>
        {/*Vạch + nhãn trục tung */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <g key={r}>
            <line
              x1={padL}
              x2={W - padR}
              y1={padT + innerH * (1 - r) + 0.5}
              y2={padT + innerH * (1 - r) + 0.5}
              stroke={isDark ? '#393e46' : '#e5e7eb'}
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={padT + innerH * (1 - r) + 4}
              textAnchor="end"
              fontSize={10}
              fill={isDark ? '#9ca3af' : '#6b7280'}
            >
              {fmtShort(max * r)}
            </text>
          </g>
        ))}
        {stats.map((s, gi) => {
          const gx = padL + gi * groupW + groupW / 2 - (barW * 3 + gap * 2) / 2;
          return (
            <g key={s.month}>
              {/* Vùng hover nguyên nhóm tháng */}
              <rect
                x={padL + gi * groupW}
                y={padT}
                width={groupW}
                height={innerH}
                fill={hover === gi ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent'}
                onMouseEnter={() => setHover(gi)}
              >
                <title>{`${monthLabel(s.month)} · Nạp ${formatVnd(s.deposits)} · Chi ${formatVnd(s.spending)} · Doanh thu ${formatVnd(s.earnings)}`}</title>
              </rect>
              {series.map((se, si) => {
                const value = (s[se.key] as number) || 0;
                const bh = scaleY(value);
                return (
                  <rect
                    key={se.key}
                    x={gx + si * (barW + gap)}
                    y={padT + innerH - bh}
                    width={barW}
                    height={Math.max(bh, value > 0 ? 2 : 0)}
                    rx={2}
                    fill={se.color}
                    pointerEvents="none"
                  />
                );
              })}
              <text
                x={padL + gi * groupW + groupW / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize={stats.length > 12 ? 9 : 11}
                fill={isDark ? '#9ca3af' : '#6b7280'}
                visibility={gi % labelStep === 0 || gi === stats.length - 1 ? 'visible' : 'hidden'}
              >
                {monthLabel(s.month)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Readout: số liệu tháng đang hover, mặc định là tổng của khoảng đang chọn */}
      <div className={`text-center text-xs mt-1 tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-600'}`} aria-live="polite">
        {hovered ? (
          <>
            <span className="font-semibold">{monthLabel(hovered.month)}:</span>{' '}
            <span className="text-accent">Nạp {formatVnd(hovered.deposits)}</span>
            {' · '}
            <span style={{ color: isDark ? '#fb923c' : '#f97316' }}>Chi {formatVnd(hovered.spending)}</span>
            {' · '}
            <span style={{ color: isDark ? '#4ade80' : '#16a34a' }}>Doanh thu {formatVnd(hovered.earnings)}</span>
          </>
        ) : (
          <>
            Tổng kỳ:{' '}
            <span className="text-accent">Nạp {formatVnd(series[0].total)}</span>
            {' · '}
            <span style={{ color: isDark ? '#fb923c' : '#f97316' }}>Chi {formatVnd(series[1].total)}</span>
            {' · '}
            <span style={{ color: isDark ? '#4ade80' : '#16a34a' }}>Doanh thu {formatVnd(series[2].total)}</span>
          </>
        )}
      </div>

      {/* Legend kèm tổng từng series */}
      <div className="flex flex-wrap gap-4 justify-center mt-1">
        {series.map((se) => (
          <span key={se.key} className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: se.color }} />
            {se.label}
            <span className="font-medium tabular-nums">{fmtShort(se.total)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const FILTERS: { key: 'ALL' | FinancialEvent['type']; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'TOPUP', label: 'Nạp tiền' },
  { key: 'VIDEO_PURCHASE', label: 'Mua video' },
  { key: 'CREATOR_REVENUE', label: 'Doanh thu' },
];

const PAGE_STEP = 15;

const CHART_RANGES: { key: string; label: string; months: number | null }[] = [
  { key: '3', label: '3 tháng', months: 3 },
  { key: '6', label: '6 tháng', months: 6 },
  { key: '12', label: '1 năm', months: 12 },
  { key: 'all', label: 'Tất cả', months: null },
];

// Cắt N tháng gần nhất từ chuỗi thống kê theo khoảng đã chọn
const sliceByRange = (stats: MonthlyStat[], range: string): MonthlyStat[] => {
  const months = CHART_RANGES.find((r) => r.key === range)?.months;
  if (!months || stats.length <= months) return stats;
  return stats.slice(stats.length - months);
};

export default function FinanceTab({ isDark }: { isDark?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financialHistory'],
    queryFn: getMyFinancialHistory,
    staleTime: 2 * 60 * 1000,
  });

  const [filter, setFilter] = useState<'ALL' | FinancialEvent['type']>('ALL');
  const [visible, setVisible] = useState(PAGE_STEP);
  const [chartRange, setChartRange] = useState<string>('6');

  const events = (data?.events ?? []).filter((e) => filter === 'ALL' || e.type === filter);
  const shownEvents = events.slice(0, visible);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`animate-pulse rounded-xl h-24 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
          ))}
        </div>
        <div className={`animate-pulse rounded-xl h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
        Không tải được dữ liệu tài chính. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          isDark={isDark}
          label="Số dư khả dụng"
          value={formatVnd(data.balance)}
          hint={`Nạp 30 ngày qua: +${formatVnd(data.deposited30d)}`}
          icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          tone="accent"
        />
        <StatCard
          isDark={isDark}
          label="Tổng doanh thu"
          value={formatVnd(data.revenue)}
          hint={`30 ngày qua: +${formatVnd(data.revenue30d)}`}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          tone="green"
        />
        <StatCard
          isDark={isDark}
          label="Tổng đã nạp"
          value={formatVnd(data.totalDeposited)}
          hint="Cộng dồn qua ví snha"
          icon="M12 19V5m0 0l-6 6m6-6l6 6"
          tone="neutral"
        />
        <StatCard
          isDark={isDark}
          label="Tổng đã chi"
          value={formatVnd(data.totalSpent)}
          hint={`30 ngày qua: -${formatVnd(data.spent30d)}`}
          icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          tone="red"
        />
      </div>

      {/* Biểu đồ theo tháng - chọn khoảng thời gian */}
      <div className={`rounded-xl border p-4 sm:p-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            Biến động {CHART_RANGES.find(r => r.key === chartRange)?.label.toLowerCase()}
          </h3>
          <div className="flex items-center gap-3">
            <div className={`flex flex-wrap gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {CHART_RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setChartRange(r.key)}
                  aria-pressed={chartRange === r.key}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    chartRange === r.key
                      ? 'bg-accent text-[var(--btn-accent-text)]'
                      : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Link
              href="/wallet/topup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium btn-accent hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <ChipIcon path="M12 4v16m8-8H4" className="w-4 h-4" />
              Nạp tiền
            </Link>
          </div>
        </div>
        <MonthlyChart stats={sliceByRange(data.monthlyStats ?? [], chartRange)} isDark={isDark} />
      </div>

      {/* Danh sách biến động */}
      <div className={`rounded-xl border p-4 sm:p-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Lịch sử giao dịch</h3>
          <div className={`flex flex-wrap gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setVisible(PAGE_STEP); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-accent text-[var(--btn-accent-text)]'
                    : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {events.length === 0 ? (
          <div className={`py-10 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Chưa có biến động nào
            {filter !== 'ALL' && ' với bộ lọc đã chọn'}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: isDark ? '#393e46' : '#e5e7eb' }}>
            {shownEvents.map((e) => {
              const meta = EVENT_TYPE_META[e.type];
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <ChipIcon path={meta.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {e.videoId ? (
                        <Link href={`/watch/${e.videoSlug || e.videoId}`} className="hover:text-accent transition-colors">
                          {e.description || meta.label}
                        </Link>
                      ) : (
                        e.description || meta.label
                      )}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {meta.label} · {formatDateTime(e.occurredAt)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold flex-shrink-0 tabular-nums ${
                      e.direction === 'IN' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {e.direction === 'IN' ? '+' : '−'}
                    {formatVnd(e.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {visible < events.length && (
          <button
            onClick={() => setVisible((v) => v + PAGE_STEP)}
            className={`mt-3 w-full py-2 rounded-lg text-sm font-medium border transition-colors ${
              isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Xem thêm ({events.length - visible} giao dịch)
          </button>
        )}

        {data.events.length >= 200 && (
          <p className={`text-xs text-center mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Đang hiển thị 200 biến động gần nhất
          </p>
        )}
      </div>

      <WithdrawalSection isDark={isDark} />
    </div>
  );
}
