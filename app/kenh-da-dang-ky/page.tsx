'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VideoCardLite from '@/components/video/VideoCardLite';
import Pagination from '@/components/common/Pagination';
import { useAuth } from '@/lib/hooks/useAuth';
import { subscriptionApi } from '@/lib/apis/subscription.api';
import { userApi } from '@/lib/apis/user.api';
import type { VideoResponse, PageResponse } from '@/types';

const PAGE_SIZE = 12;
const FETCH_SIZE = 50;

type SortOption = 'newest' | 'popular' | 'favorites' | 'comments' | 'longest';

const sortOptions: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  {
    key: 'newest',
    label: 'Mới nhất',
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
  },
  {
    key: 'popular',
    label: 'Xem nhiều',
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
      </svg>
    ),
  },
  {
    key: 'favorites',
    label: 'Yêu thích',
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
      </svg>
    ),
  },
  {
    key: 'comments',
    label: 'Bình luận',
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
      </svg>
    ),
  },
  {
    key: 'longest',
    label: 'Dài nhất',
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' />
      </svg>
    ),
  },
];

function sortVideos(list: VideoResponse[], sortBy: SortOption): VideoResponse[] {
  const arr = [...list];
  switch (sortBy) {
    case 'popular':
      return arr.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    case 'favorites':
      return arr.sort((a, b) => (b.favoritesCount ?? 0) - (a.favoritesCount ?? 0));
    case 'comments':
      return arr.sort((a, b) => (b.commentsCount ?? 0) - (a.commentsCount ?? 0));
    case 'longest':
      return arr.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
    case 'newest':
    default:
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Lấy toàn bộ video của một kênh bằng cách duyệt hết các trang
async function fetchAllChannelVideos(channelId: string): Promise<VideoResponse[]> {
  const all: VideoResponse[] = [];
  let page = 0;
  while (true) {
    const data = (await userApi.getVideos(channelId, { page, size: FETCH_SIZE })) as unknown as PageResponse<VideoResponse>;
    const content = data.content || [];
    all.push(...content);
    if (content.length < FETCH_SIZE || page + 1 >= (data.totalPages ?? 1)) break;
    page++;
  }
  return all;
}

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();

  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sorted = useMemo(() => sortVideos(videos, sortBy), [videos, sortBy]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const channelIds = await subscriptionApi.getMySubscriptions();
      if (!channelIds || channelIds.length === 0) {
        setVideos([]);
        setPage(0);
        return;
      }

      const results = await Promise.all(
        channelIds.map((id) => fetchAllChannelVideos(id).catch(() => []))
      );

      const merged = results
        .flat()
        .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setVideos(merged);
      setPage(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách video');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) load();
    if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, load]);

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 container mx-auto px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
            <h1 className='text-3xl font-bold text-foreground flex items-center gap-2'>
              <svg className='w-8 h-8 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
              </svg>
              Kênh đã đăng ký
            </h1>

            {videos.length > 0 && (
              <div className='flex items-center gap-1 p-1 rounded-xl bg-secondary w-fit'>
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => { setSortBy(option.key); setPage(0); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      sortBy === option.key
                        ? 'bg-accent text-white shadow'
                        : 'text-foreground opacity-70 hover:opacity-100 hover:bg-accent/10'
                    }`}
                  >
                    {option.icon}
                    <span className='hidden sm:inline'>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!user && !authLoading ? (
            <div className='text-center py-20 bg-secondary rounded-2xl border border-accent/20 text-foreground opacity-70'>
              <p className='text-lg mb-4'>Vui lòng đăng nhập để xem video từ kênh đã đăng ký</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { tab: 'login' } }))}
                className='btn-accent px-5 py-2 rounded-lg font-medium'
              >
                Đăng nhập
              </button>
            </div>
          ) : loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className='bg-secondary rounded-xl overflow-hidden animate-pulse'>
                  <div className='w-full aspect-video bg-accent/10' />
                  <div className='p-4 space-y-2'>
                    <div className='h-4 w-3/4 rounded bg-accent/10' />
                    <div className='h-3 w-1/2 rounded bg-accent/10' />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className='text-center py-16 text-red-600'>{error}</div>
          ) : videos.length === 0 ? (
            <div className='text-center py-20 bg-secondary rounded-2xl border border-accent/20 text-foreground opacity-70'>
              <div className='text-5xl mb-3'>🔔</div>
              <p className='text-lg mb-4'>Bạn chưa đăng ký kênh nào</p>
              <Link href='/' className='btn-accent px-5 py-2 rounded-lg font-medium inline-block'>
                Khám phá kênh
              </Link>
            </div>
          ) : (
            <>
              {videos.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8'>
                  {sorted
                    .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
                    .map((video) => (
                      <VideoCardLite key={video.id} video={video} />
                    ))}
                </div>
              )}

              {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
