'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import searchApi, { ChannelSearchResult } from '@/lib/apis/search.api';
import { useAuth } from '@/lib/hooks/useAuth';
import type { VideoResponse } from '@/types';
import type { NewsResponse } from '@/lib/apis/news.api';

/**
 * Trang kết quả tìm kiếm đầy đủ: /search?q=...&tab=video|channel|news
 */

type Tab = 'video' | 'channel' | 'news';

const PAGE_SIZE = 12;

function formatViews(views?: number): string {
  if (!views) return '0 lượt xem';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)} tỷ lượt xem`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)} tr lượt xem`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}N lượt xem`;
  return `${views} lượt xem`;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

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

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'video', label: 'Video', count: total.video },
    { key: 'channel', label: 'Kênh', count: total.channel },
    { key: 'news', label: 'Tin tức', count: total.news },
  ];

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary'>
        <div className='container mx-auto px-4 py-6'>
          {/* Ô tìm kiếm lại trên trang kết quả */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = queryInput.trim();
              if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
            }}
            className='max-w-2xl mx-auto'
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
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
              </button>
            </div>
          </form>

          {/* Từ khóa + tabs */}
          {q ? (
            <>
              <p className='max-w-2xl mx-auto mt-6 text-sm text-foreground opacity-70'>
                Kết quả tìm kiếm cho <span className='font-semibold text-foreground'>&quot;{q}&quot;</span>
              </p>
              <div className='max-w-2xl mx-auto mt-3 flex items-center gap-2 border-b border-secondary overflow-x-auto scrollbar-hide'>
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => switchTab(t.key)}
                    className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.key
                        ? 'border-accent text-foreground'
                        : 'border-transparent text-foreground opacity-60 hover:text-foreground hover:opacity-100'
                    }`}
                  >
                    {t.label} {t.count > 0 && <span className='opacity-60'>({t.count})</span>}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className='max-w-2xl mx-auto mt-10 text-center text-foreground opacity-60'>
              Nhập từ khóa để tìm kiếm video, kênh hoặc tin tức
            </p>
          )}

          {/* Kết quả */}
          <div className='max-w-6xl mx-auto mt-6'>
            {loading && (
              <div className='flex justify-center py-10'>
                <span className='w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin' />
              </div>
            )}

            {!loading && q && tab === 'video' && (
              videos.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                  {videos.map((v) => (
                    <Link key={v.id} href={`/watch/${v.slug || v.id}`} className='group'>
                      <div className='relative rounded-lg overflow-hidden bg-secondary aspect-video'>
                        <img
                          src={v.thumbnailUrl || v.splashImageUrl}
                          alt={v.title}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                        />
                        {v.duration ? (
                          <span className='absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-xs bg-black/80 text-white rounded'>
                            {formatDuration(v.duration)}
                          </span>
                        ) : null}
                        {v.price ? (
                          <span className='absolute top-1.5 left-1.5 px-1.5 py-0.5 text-xs bg-accent text-white rounded font-medium'>
                            {v.price.toLocaleString('vi-VN')}đ
                          </span>
                        ) : null}
                      </div>
                      <p className='mt-2 text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors'>
                        {v.title}
                      </p>
                      <p className='text-xs text-foreground opacity-60 truncate'>
                        {v.userFullName} • {formatViews(v.views)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className='text-center py-10 text-foreground opacity-60'>Không tìm thấy video nào</p>
              )
            )}

            {!loading && q && tab === 'channel' && (
              channels.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {channels.map((c) => (
                    <Link
                      key={c.id}
                      href={`/channel/${c.channelSlug || c.id}`}
                      className='flex items-center gap-4 p-4 rounded-lg border border-secondary hover:border-accent transition-colors'
                    >
                      {c.avatar ? (
                        <img src={c.avatar} alt='' className='w-14 h-14 rounded-full object-cover bg-secondary' />
                      ) : (
                        <span className='w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold'>
                          {(c.fullName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className='min-w-0'>
                        <p className='font-medium text-foreground truncate'>{c.fullName}</p>
                        <p className='text-xs text-foreground opacity-60'>Kênh</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className='text-center py-10 text-foreground opacity-60'>Không tìm thấy kênh nào</p>
              )
            )}

            {!loading && q && tab === 'news' && (
              news.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {news.map((n) => (
                    <Link key={n.id} href={`/news/${n.id}`} className='group'>
                      <div className='rounded-lg overflow-hidden bg-secondary aspect-video'>
                        {n.thumbnailUrl ? (
                          <img
                            src={n.thumbnailUrl}
                            alt={n.title}
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center text-4xl'>📰</div>
                        )}
                      </div>
                      <p className='mt-2 text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors'>
                        {n.title}
                      </p>
                      {n.summary && <p className='mt-1 text-xs text-foreground opacity-60 line-clamp-2'>{n.summary}</p>}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className='text-center py-10 text-foreground opacity-60'>Không tìm thấy tin tức nào</p>
              )
            )}

            {/* Phân trang */}
            {!loading && q && totalPages > 1 && (
              <div className='flex items-center justify-center gap-2 mt-8'>
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
        </div>
      </div>
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
