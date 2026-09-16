'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi, type DailyPoint } from '@/lib/apis/analytics.api';

const formatNumber = (v?: number) => new Intl.NumberFormat('vi-VN').format(v ?? 0);

const fmtShort = (v: number): string => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')}tr`;
  if (v >= 1_000) return `${Math.round(v / 1000)}k`;
  return `${Math.round(v)}`;
};

const niceCeil = (v: number): number => {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
};

const dayLabel = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const ChipIcon = ({ path, className = 'w-4 h-4' }: { path: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

// Biểu đồ đường/area theo ngày: trục tung, hover đọc giá trị
function DailyLineChart({
  points,
  color,
  unit,
  isDark,
}: {
  points: DailyPoint[];
  color: string;
  unit: string;
  isDark?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 660;
  const H = 220;
  const padL = 44;
  const padR = 10;
  const padT = 12;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = niceCeil(Math.max(1, ...points.map((p) => p.count)));
  const n = points.length;
  const x = (i: number) => (n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`).join(' ');
  const areaPath = n > 0
    ? `${linePath} L${x(n - 1).toFixed(1)},${padT + innerH} L${x(0).toFixed(1)},${padT + innerH} Z`
    : '';
  const step = Math.max(1, Math.ceil(n / 6));
  const gridColor = isDark ? '#393e46' : '#e5e7eb';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const hovered = hover !== null ? points[hover] : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <g key={r}>
            <line
              x1={padL} x2={W - padR}
              y1={padT + innerH * (1 - r) + 0.5}
              y2={padT + innerH * (1 - r) + 0.5}
              stroke={gridColor} strokeWidth={1}
            />
            <text x={padL - 6} y={padT + innerH * (1 - r) + 4} textAnchor="end" fontSize={10} fill={textColor}>
              {fmtShort(max * r)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={color} fillOpacity={0.12} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Vùng hover theo điểm dữ liệu */}
        {points.map((p, i) => {
          const bandW = n > 1 ? innerW / (n - 1) : innerW;
          return (
            <rect
              key={`${p.date}-hit`}
              x={x(i) - bandW / 2}
              y={padT}
              width={bandW}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          );
        })}

        {hover !== null && points[hover] && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + innerH} stroke={color} strokeOpacity={0.35} strokeWidth={1} />
            <circle cx={x(hover)} cy={y(points[hover].count)} r={4} fill={color} />
          </g>
        )}

        {points.map((p, i) => (
          <text
            key={`${p.date}-lbl`}
            x={x(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill={textColor}
            visibility={i % step === 0 || i === n - 1 ? 'visible' : 'hidden'}
          >
            {dayLabel(p.date)}
          </text>
        ))}
      </svg>
      <div className={`text-center text-xs mt-1 tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-600'}`} aria-live="polite">
        {hovered ? (
          <>
            <span className="font-semibold">{dayLabel(hovered.date)}</span> · {unit}: {formatNumber(hovered.count)}
          </>
        ) : (
          <>
            Tổng kỳ: <span className="font-semibold">{formatNumber(points.reduce((a, p) => a + p.count, 0))}</span> {unit.toLowerCase()}
          </>
        )}
      </div>
    </div>
  );
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  READY: { label: 'Đã đăng', color: '#16a34a' },
  PROCESSING: { label: 'Đang xử lý', color: '#f97316' },
  UPLOADING: { label: 'Đang tải lên', color: '#3b82f6' },
  FAILED: { label: 'Lỗi', color: '#ef4444' },
};

function StatCard({
  label, value, hint, iconPath, iconClass, isDark,
}: {
  label: string; value: string; hint?: string; iconPath: string; iconClass: string; isDark?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          <ChipIcon path={iconPath} className="w-4 h-4" />
        </span>
        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      </div>
      <p className="mt-2.5 text-xl font-bold text-foreground tabular-nums">{value}</p>
      {hint && <p className={`mt-0.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{hint}</p>}
    </div>
  );
}

export default function AnalyticsTab({ isDark }: { isDark?: boolean }) {
  const [series, setSeries] = useState<'views' | 'subscribers'>('views');
  const [trend, setTrend] = useState<'7' | '30' | 'all'>('30');

  const { data, isLoading, error } = useQuery({
    queryKey: ['channelAnalytics', trend],
    queryFn: () => analyticsApi.getMyChannelAnalytics(trend),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`animate-pulse rounded-xl h-24 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
          ))}
        </div>
        <div className={`animate-pulse rounded-xl h-72 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
        Không tải được số liệu thống kê. Vui lòng thử lại sau.
      </div>
    );
  }

  const points = series === 'views' ? data.viewTrend : data.subscriberTrend;
  const statusTotal = Object.values(data.statusBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          isDark={isDark} label="Lượt xem" value={formatNumber(data.totalViews)}
          hint={`Hôm nay: +${formatNumber(data.viewsToday)}`}
          iconPath="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          iconClass="bg-accent/15 text-accent"
        />
        <StatCard
          isDark={isDark} label="Người đăng ký" value={formatNumber(data.subscriberCount)}
          hint={`+${formatNumber(data.newSubscribers30d)} trong 30 ngày`}
          iconPath="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z"
          iconClass="bg-green-500/15 text-green-600"
        />
        <StatCard
          isDark={isDark} label="Video" value={formatNumber(data.videoCount)}
          hint="không tính đã xóa"
          iconPath="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          iconClass="bg-blue-500/15 text-blue-600"
        />
        <StatCard
          isDark={isDark} label="Lượt thích" value={formatNumber(data.totalLikes)}
          iconPath="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          iconClass="bg-pink-500/15 text-pink-500"
        />
        <StatCard
          isDark={isDark} label="Bình luận" value={formatNumber(data.totalComments)}
          iconPath="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          iconClass="bg-amber-500/15 text-amber-500"
        />
      </div>

      {/* Biểu đồ xu hướng */}
      <div className={`rounded-xl border p-4 sm:p-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            Xu hướng {trend === 'all' ? 'toàn bộ thời gian' : `${trend} ngày gần nhất`}
          </h3>
          <div className="flex items-center gap-3">
            <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {([
                { key: 'views', label: 'Lượt xem' },
                { key: 'subscribers', label: 'Đăng ký mới' },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSeries(s.key)}
                  aria-pressed={series === s.key}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    series === s.key
                      ? 'bg-accent text-[var(--btn-accent-text)]'
                      : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {([
                { key: '7', label: '7N' },
                { key: '30', label: '30N' },
                { key: 'all', label: 'Tất cả' },
              ] as const).map((o) => (
                <button
                  key={o.key}
                  onClick={() => setTrend(o.key)}
                  aria-pressed={trend === o.key}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    trend === o.key
                      ? 'bg-accent text-[var(--btn-accent-text)]'
                      : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DailyLineChart
          points={points}
          color={series === 'views' ? 'var(--color-accent)' : isDark ? '#4ade80' : '#16a34a'}
          unit={series === 'views' ? 'Lượt xem' : 'Người đăng ký'}
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cơ cấu trạng thái video */}
        <div className={`rounded-xl border p-4 sm:p-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Cơ cấu video</h3>
          {statusTotal === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kênh chưa có video nào.</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(data.statusBreakdown).map(([status, count]) => {
                const meta = STATUS_META[status] ?? { label: status, color: '#9ca3af' };
                const pct = Math.round((count / statusTotal) * 100);
                return (
                  <li key={status}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{meta.label}</span>
                      <span className="tabular-nums text-foreground/80">{formatNumber(count)} · {pct}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className={`mt-4 pt-3 border-t text-xs ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            Tổng cộng {formatNumber(statusTotal)} video trên kênh
          </div>
        </div>

        {/* Top video */}
        <div className={`xl:col-span-2 rounded-xl border p-4 sm:p-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Video hiệu quả nhất</h3>
            <Link href="/profile?tab=my-videos" className="text-xs font-medium text-accent hover:underline">
              Xem tất cả video
            </Link>
          </div>
          {data.topVideos.length === 0 ? (
            <div className={`py-10 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Chưa có video nào để thống kê.
              <div className="mt-3">
                <Link href="/upload" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium btn-accent hover:opacity-90 transition-opacity">
                  <ChipIcon path="M12 4v16m8-8H4" />
                  Tải video đầu tiên lên
                </Link>
              </div>
            </div>
          ) : (
            <ol className="space-y-1">
              {data.topVideos.map((v, idx) => (
                <li key={v.id}>
                  <Link
                    href={`/watch/${v.id}`}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`w-6 text-center text-sm font-bold tabular-nums ${idx < 3 ? 'text-accent' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {idx + 1}
                    </span>
                    {v.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        className="w-24 aspect-video rounded-lg object-cover bg-secondary flex-shrink-0"
                      />
                    ) : (
                      <span className="w-24 aspect-video rounded-lg bg-secondary flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {v.publishedAt ? `Đăng ngày ${v.publishedAt.split('-').reverse().join('/')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs tabular-nums flex-shrink-0">
                      <span className="text-foreground/80 font-semibold" title="Lượt xem">
                        <span className="hidden md:inline">{formatNumber(v.views)} lượt xem</span>
                        <span className="md:hidden">{fmtShort(v.views)}</span>
                      </span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'} title="Lượt thích">
                        <span className="hidden md:inline">{formatNumber(v.likes)}</span>
                        <span className="md:hidden">{fmtShort(v.likes)}</span>
                        <ChipIcon path="M14 10h4.745M12 21.375 4.128 13.5a5.35 5.35 0 0 1-.037-7.6l.03-.03a5.351 5.351 0 0 1 7.552 0L12 6.198l.327-.328a5.351 5.351 0 0 1 7.552 0l.03.03a5.35 5.35 0 0 1-.037 7.6L12 21.375Z" className="w-3 h-3 inline ml-1 -mt-0.5" />
                      </span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'} title="Bình luận">
                        <span className="hidden md:inline">{formatNumber(v.comments)}</span>
                        <span className="md:hidden">{fmtShort(v.comments)}</span>
                        <ChipIcon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-3 h-3 inline ml-1 -mt-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
