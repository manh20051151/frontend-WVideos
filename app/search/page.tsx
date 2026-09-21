'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import searchApi, { ChannelSearchResult } from '@/lib/apis/search.api';
import { useAuth } from '@/lib/hooks/useAuth';
import VideoCardLite from '@/components/video/VideoCardLite';
import type { VideoResponse } from '@/types';
import type { NewsResponse } from '@/lib/apis/news.api';

/**
 * Trang kết quả tìm kiếm đầy đủ: /search?q=...&tab=video|channel|news
 */

type Tab = 'video' | 'channel' | 'news';

const PAGE_SIZE = 12;

// ===== Icon =====

const PlayIcon = () => (
  <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M8 5.14v13.72c0 .8.87 1.3 1.56.9l11-6.86a1.05 1.05 0 000-1.8l-11-6.86A1.05 1.05 0 008 5.14z' />
  </svg>
);

const UsersIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' d='M17 20h5v-2a3 3 0 00-5.36-1.86M17 20H7m10 0v-2c0-.66-.13-1.3-.36-1.86m0 0a5 5 0 00-9.28 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
  </svg>
);

const NewsIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v1m-4-3v9a2 2 0 002 2h0a2 2 0 002-2v-5.34a2 2 0 00-.3-1.07l-1.83-3A2 2 0 0018.6 10H16zM7 9h6M7 13h6' />
  </svg>
);

const SearchIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
  </svg>
);

const ChevronRight = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
  </svg>
);

// ===== Helpers =====

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 1) return 'Hôm nay';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Sinh danh sách số trang: 1 … 4 5 6 … 12
function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set<number>([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) result.push('…');
    result.push(p);
  });
  return result;
}

// ===== Skeleton khi đang tải =====

const SkeletonVideoCard = () => (
  <div className='rounded-xl overflow-hidden bg-secondary animate-pulse'>
    <div className='aspect-video' />
    <div className='p-4 space-y-2.5'>
      <div className='h-4 rounded w-11/12' />
      <div className='h-4 rounded w-2/3' />
      <div className='h-3 rounded w-1/2 mt-3' />
    </div>
  </div>
);

const SkeletonRowCard = () => (
  <div className='flex items-center gap-4 p-5 rounded-xl border border-secondary animate-pulse'>
    <div className='w-16 h-16 rounded-full bg-secondary' />
    <div className='flex-1 space-y-2.5'>
      <div className='h-4 rounded w-2/3' />
      <div className='h-3 rounded w-1/3' />
    </div>
  </div>
);

const SkeletonNewsCard = () => (
  <div className='rounded-xl overflow-hidden border border-secondary animate-pulse'>
    <div className='aspect-video bg-secondary' />
    <div className='p-4 space-y-2.5'>
      <div className='h-3 rounded w-1/3' />
      <div className='h-4 rounded w-full' />
      <div className='h-4 rounded w-4/5' />
      <div className='h-3 rounded w-1/2' />
    </div>
  </div>
);

// ===== Trạng thái rỗng =====

const EmptyState = ({ title, desc }: { title: string; desc: string }) => (
  <div className='flex flex-col items-center justify-center text-center py-20 px-4'>
    <div className='w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5'>
      <SearchIcon className='w-9 h-9 text-foreground opacity-40' />
    </div>
    <p className='text-lg font-semibold text-foreground'>{title}</p>
    <p className='mt-1.5 text-sm text-foreground opacity-60 max-w-sm'>{desc}</p>
    <Link
      href='/'
      className='mt-6 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity'
    >
      Về trang chủ
    </Link>
  </div>
);

// ===== Trang chính =====

function SearchPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') || '').trim();
  const tabParam = searchParams.get('tab') as Tab | null;
  const tab: Tab = tabParam === 'channel' || tabParam === 'news' ? tabParam : 'video';

  const [queryInput, setQueryInput] = useState(q);
  useEffect(() => setQueryInput(q), [q]);

  // Dữ liệu từng tab (giữ riêng để chuyển tab không mất kết quả đã tải)
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [channels, setChannels] = useState<ChannelSearchResult[]>([]);
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [total, setTotal] = useState<{ video: number; channel: number; news: number }>({ video: 0, channel: 0, news: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Tải lại khi đổi từ khóa / tab / trang
  useEffect(() => {
    if (!q) {
      setVideos([]);
      setChannels([]);
      setNews([]);
      setTotal({ video: 0, channel: 0, news: 0 });
      setTotalPages(1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const fetch = async () => {
      try {
        if (tab === 'video') {
          const data = await searchApi.searchVideos(q, page, PAGE_SIZE);
          if (cancelled) return;
          setVideos(data.content ?? []);
          setTotal((t) => ({ ...t, video: data.totalElements ?? 0 }));
          setTotalPages(data.totalPages ?? 1);
        } else if (tab === 'channel') {
          const data = await searchApi.searchChannels(q, page, PAGE_SIZE);
          if (cancelled) return;
          setChannels(data.content ?? []);
          setTotal((t) => ({ ...t, channel: data.totalElements ?? 0 }));
          setTotalPages(data.totalPages ?? 1);
        } else {
          const data = await searchApi.searchNews(q, page, PAGE_SIZE);
          if (cancelled) return;
          setNews(data.content ?? []);
          setTotal((t) => ({ ...t, news: data.totalElements ?? 0 }));
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        // Lỗi -> giữ kết quả cũ
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [q, tab, page]);

  // Đếm số kết quả của CẢ 3 tab ngay khi đổi từ khóa (request nhẹ size=1),
  // để badge số lượng trên từng tab luôn hiển thị như YouTube
  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const [v, c, n] = await Promise.all([
          searchApi.searchVideos(q, 0, 1),
          searchApi.searchChannels(q, 0, 1),
          searchApi.searchNews(q, 0, 1),
        ]);
        if (cancelled) return;
        setTotal({
          video: v.totalElements ?? 0,
          channel: c.totalElements ?? 0,
          news: n.totalElements ?? 0,
        });
      } catch {
        // Lỗi -> giữ số cũ
      }
    };
    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, [q]);

  // Đổi tab / từ khóa mới -> reset về trang 1
  useEffect(() => {
    setPage(0);
  }, [q, tab]);

  // Lưu từ khóa vào lịch sử tìm kiếm khi đến trang kết quả
  // (user đăng nhập: server; khách: localStorage - cùng logic với HeaderSearch)
  useEffect(() => {
    if (!q) return;
    if (isAuthenticated) {
      searchApi.saveHistory(q).catch(() => {});
    } else if (typeof window !== 'undefined') {
      try {
        const key = 'searchHistory';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        const rest = (Array.isArray(arr) ? arr : []).filter(
          (x: unknown) => typeof x === 'string' && x.toLowerCase() !== q.toLowerCase()
        );
        localStorage.setItem(key, JSON.stringify([q, ...rest].slice(0, 10)));
      } catch {
        // bỏ qua lỗi parse localStorage
      }
    }
  }, [q, isAuthenticated]);

  const switchTab = (next: Tab) => {
    router.push(`/search?q=${encodeURIComponent(q)}${next !== 'video' ? `&tab=${next}` : ''}`);
  };

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'video', label: 'Video', count: total.video, icon: <PlayIcon /> },
    { key: 'channel', label: 'Kênh', count: total.channel, icon: <UsersIcon /> },
    { key: 'news', label: 'Tin tức', count: total.news, icon: <NewsIcon /> },
  ];

  const activeCount = total[tab];

  return (
    <>
      <Header />
      <main className='min-h-screen bg-primary'>
        <div className='mx-auto max-w-7xl px-4 pb-16 pt-6 lg:pt-10'>
          {/* Ô tìm kiếm lại trên trang kết quả - chỉ hiện trên mobile
              (desktop đã có sẵn ô search trên header) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = queryInput.trim();
              if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
            }}
            className='lg:hidden max-w-2xl mx-auto'
          >
            <div className='relative'>
              <input
                type='text'
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder='Tìm kiếm video, kênh, tin tức...'
                className='w-full px-4 py-3 bg-secondary text-foreground placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-accent'
              />
              <button
                type='submit'
                className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-foreground hover:bg-primary transition-colors'
                aria-label='Tìm kiếm'
              >
                <SearchIcon />
              </button>
            </div>
          </form>

          {!q ? (
            // ===== Chưa có từ khóa =====
            <div className='flex flex-col items-center justify-center text-center py-28 px-4'>
              <div className='w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6'>
                <SearchIcon className='w-11 h-11 text-foreground opacity-30' />
              </div>
              <h1 className='text-xl font-bold text-foreground'>Tìm kiếm trên WVideos</h1>
              <p className='mt-2 text-sm text-foreground opacity-60 max-w-sm'>
                Nhập từ khóa ở ô tìm kiếm phía trên để tìm video, kênh hoặc tin tức bạn quan tâm
              </p>
            </div>
          ) : (
            <>
              {/* ===== Tiêu đề kết quả ===== */}
              <div className='mt-4 lg:mt-0'>
                <p className='text-sm text-foreground opacity-60'>Kết quả tìm kiếm cho</p>
                <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1'>
                  <h1 className='text-2xl lg:text-3xl font-bold text-foreground break-all'>&quot;{q}&quot;</h1>
                  {!loading && (
                    <span className='px-3 py-1 rounded-full bg-secondary text-sm font-medium text-foreground opacity-80'>
                      {activeCount} kết quả
                    </span>
                  )}
                </div>
              </div>

              {/* ===== Tabs dạng segmented control ===== */}
              <div className='mt-6 inline-flex items-center gap-1 bg-secondary rounded-full p-1.5 overflow-x-auto scrollbar-hide max-w-full'>
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => switchTab(t.key)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      tab === t.key
                        ? 'bg-accent text-white shadow-md shadow-accent/30'
                        : 'text-foreground opacity-70 hover:opacity-100 hover:text-foreground'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                    {t.count > 0 && (
                      <span
                        className={`min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          tab === t.key ? 'bg-white/25 text-white' : 'bg-primary text-foreground opacity-70'
                        }`}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ===== Kết quả ===== */}
              <div className='mt-8'>
                {/* Skeleton khi đang tải */}
                {loading && (
                  <div
                    className={
                      tab === 'video'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    }
                  >
                    {tab === 'video'
                      ? Array.from({ length: 8 }, (_, i) => <SkeletonVideoCard key={i} />)
                      : tab === 'channel'
                        ? Array.from({ length: 6 }, (_, i) => <SkeletonRowCard key={i} />)
                        : Array.from({ length: 6 }, (_, i) => <SkeletonNewsCard key={i} />)}
                  </div>
                )}

                {/* Video */}
                {!loading && tab === 'video' && (
                  videos.length > 0 ? (
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                      {videos.map((v) => (
                        <VideoCardLite key={v.id} video={v} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title='Không tìm thấy video nào'
                      desc={`Không có video nào khớp với "${q}". Thử từ khóa khác hoặc xem các tab Kênh, Tin tức.`}
                    />
                  )
                )}

                {/* Kênh */}
                {!loading && tab === 'channel' && (
                  channels.length > 0 ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {channels.map((c) => (
                        <Link
                          key={c.id}
                          href={`/channel/${c.channelSlug || c.id}`}
                          className='group flex items-center gap-4 p-5 rounded-xl border border-secondary hover:border-accent hover:shadow-lg transition-all'
                        >
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.fullName}
                              className='w-16 h-16 rounded-full object-cover bg-secondary ring-2 ring-transparent group-hover:ring-accent transition-all'
                            />
                          ) : (
                            <span className='w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-2xl font-bold'>
                              {(c.fullName || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className='min-w-0 flex-1'>
                            <p className='font-semibold text-foreground truncate group-hover:text-accent transition-colors'>
                              {c.fullName}
                            </p>
                            <p className='mt-0.5 text-xs text-foreground opacity-60'>Kênh</p>
                          </div>
                          <span className='text-foreground opacity-0 group-hover:opacity-60 transition-opacity'>
                            <ChevronRight />
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title='Không tìm thấy kênh nào'
                      desc={`Không có kênh nào khớp với "${q}". Thử từ khóa khác hoặc xem tab Video.`}
                    />
                  )
                )}

                {/* Tin tức */}
                {!loading && tab === 'news' && (
                  news.length > 0 ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {news.map((n) => (
                        <Link
                          key={n.id}
                          href={`/news/${n.id}`}
                          className='group rounded-xl overflow-hidden border border-secondary hover:border-accent hover:shadow-lg transition-all'
                        >
                          <div className='relative aspect-video bg-secondary overflow-hidden'>
                            {n.thumbnailUrl ? (
                              <img
                                src={n.thumbnailUrl}
                                alt={n.title}
                                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                              />
                            ) : (
                              <div className='w-full h-full flex items-center justify-center text-4xl opacity-50'>📰</div>
                            )}
                            {n.category && (
                              <span className='absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-medium backdrop-blur-sm'>
                                {n.category.name}
                              </span>
                            )}
                          </div>
                          <div className='p-4'>
                            <p className='font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors'>
                              {n.title}
                            </p>
                            {n.summary && (
                              <p className='mt-1.5 text-sm text-foreground opacity-60 line-clamp-2'>{n.summary}</p>
                            )}
                            <p className='mt-3 text-xs text-foreground opacity-50'>
                              {n.authorName}
                              {n.publishedAt && ` • ${formatDate(n.publishedAt)}`}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title='Không tìm thấy tin tức nào'
                      desc={`Không có tin tức nào khớp với "${q}". Thử từ khóa khác hoặc xem tab Video.`}
                    />
                  )
                )}

                {/* ===== Phân trang ===== */}
                {!loading && totalPages > 1 && (
                  <div className='mt-12 flex flex-col items-center gap-3'>
                    <div className='flex items-center gap-1.5'>
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 0))}
                        disabled={page === 0}
                        aria-label='Trang trước'
                        className='w-10 h-10 rounded-full border border-secondary text-foreground flex items-center justify-center disabled:opacity-30 hover:border-accent hover:text-accent transition-colors'
                      >
                        <svg className='w-4 h-4 rotate-180' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
                        </svg>
                      </button>
                      {pageList(page, totalPages).map((p, i) =>
                        p === '…' ? (
                          <span key={`e${i}`} className='w-8 text-center text-foreground opacity-40'>
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                              page === p
                                ? 'bg-accent text-white shadow-md shadow-accent/30'
                                : 'border border-secondary text-foreground hover:border-accent hover:text-accent'
                            }`}
                          >
                            {p + 1}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                        disabled={page >= totalPages - 1}
                        aria-label='Trang sau'
                        className='w-10 h-10 rounded-full border border-secondary text-foreground flex items-center justify-center disabled:opacity-30 hover:border-accent hover:text-accent transition-colors'
                      >
                        <ChevronRight />
                      </button>
                    </div>
                    <p className='text-xs text-foreground opacity-50'>
                      Trang {page + 1} / {totalPages} • {activeCount} kết quả
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
