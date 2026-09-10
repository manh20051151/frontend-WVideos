'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import videoApi from '@/lib/apis/video.api';
import type { ShortsResponse } from '@/types';

const PAGE_SIZE = 10;
const MARK_WATCHED_DELAY = 3000; // ms: đánh dấu đã xem sau khi xem 3s

export default function ShortsPage() {
  const [videos, setVideos] = useState<ShortsResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastCreatedAt, setLastCreatedAt] = useState<string | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [guestId, setGuestId] = useState<string | undefined>(undefined);
  const [likeState, setLikeState] = useState<Record<string, { liked: boolean; count: number }>>({});

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Guest id cho người dùng chưa đăng nhập (lưu localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let id = localStorage.getItem('guestId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('guestId', id);
    }
    setGuestId(id);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const data = await videoApi.getShorts({
        size: PAGE_SIZE,
        lastCreatedAt,
        guestId,
      });
      if (data.length < PAGE_SIZE) setHasMore(false);
      if (data.length > 0) {
        setLastCreatedAt(data[data.length - 1].createdAt);
      }
      setVideos((prev) => [...prev, ...data]);
    } catch (e) {
      console.error('Lỗi tải shorts:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastCreatedAt, guestId]);

  // Tải trang đầu
  useEffect(() => {
    if (guestId && videos.length === 0) {
      loadMore();
    }
  }, [guestId, videos.length, loadMore]);

  // IntersectionObserver: xác định video đang active
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const id = (entry.target as HTMLElement).dataset.id;
            if (id) setActiveId(id);
          }
        });
      },
      { threshold: [0.6] }
    );

    root.querySelectorAll('[data-id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [videos]);

  // Khi chuyển sang video khác thì bỏ trạng thái tạm dừng
  useEffect(() => {
    setPaused(false);
  }, [activeId]);

  // Play active, pause others (tôn trọng trạng thái paused của user)
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      const section = v.closest('[data-id]');
      if (section && section.getAttribute('data-id') === activeId) {
        if (paused) {
          v.pause();
        } else {
          v.play().catch(() => {});
        }
      } else {
        v.pause();
      }
    });
  }, [activeId, paused]);

  // Đánh dấu đã xem + tăng view khi active đủ lâu
  useEffect(() => {
    if (!activeId) return;
    const timer = setTimeout(() => {
      videoApi.markWatched(activeId, guestId);
      videoApi.incrementViews(activeId).catch(() => {});
    }, MARK_WATCHED_DELAY);
    return () => clearTimeout(timer);
  }, [activeId, guestId]);

  // Infinite scroll: khi gần cuối thì load thêm
  useEffect(() => {
    if (!activeId || !hasMore || loading) return;
    const activeIndex = videos.findIndex((v) => v.id === activeId);
    if (activeIndex >= 0 && activeIndex >= videos.length - 3) {
      loadMore();
    }
  }, [activeId, videos, hasMore, loading, loadMore]);

  const setVideoRef = (index: number) => (el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el;
  };

  // Format số lượng kiểu TikTok: 138.9K, 2.1M
  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };

  const toggleLike = (id: string) => {
    setLikeState((prev) => {
      const v = videos.find((x) => x.id === id);
      const base = prev[id] ?? { liked: !!v?.isLiked, count: v?.likeCount ?? 0 };
      const liked = !base.liked;
      return { ...prev, [id]: { liked, count: base.count + (liked ? 1 : -1) } };
    });
  };

  return (
    <div className='h-[100dvh] w-full bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide' ref={containerRef}>
      {videos.map((v, index) => (
        <section
          key={v.id}
          data-id={v.id}
          className='relative h-[100dvh] w-full snap-start flex items-center justify-center bg-black'
        >
          {v.streamUrl ? (
            <video
              ref={setVideoRef(index)}
              src={v.streamUrl}
              className='h-full w-full object-contain'
              muted={muted}
              loop
              playsInline
              preload='auto'
              onClick={() => setPaused((p) => !p)}
            />
          ) : (
            <div className='flex flex-col items-center text-white'>
              <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-3' />
              <p className='opacity-70'>Không thể tải video</p>
            </div>
          )}

          {/* Icon tạm dừng khi user pause video đang phát */}
          {paused && activeId === v.id && (
            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
              <div className='w-20 h-20 rounded-full bg-black/50 flex items-center justify-center text-white'>
                <svg width='32' height='32' viewBox='0 0 24 24' fill='white' className='ml-1'>
                  <path d='M8 5v14l11-7z' />
                </svg>
              </div>
            </div>
          )}

          {/* Thanh action bar bên phải (style TikTok) */}
          <div className='absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5 text-white'>
            {/* Avatar + follow */}
            <div className='relative'>
              <img
                src={v.thumbnailUrl || v.splashImageUrl}
                alt={v.userFullName}
                className='w-12 h-12 rounded-full object-cover border-2 border-white'
              />
              <button
                className='absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-sm leading-none'
                aria-label='Theo dõi'
              >
                +
              </button>
            </div>

            {/* Like */}
            <button onClick={() => toggleLike(v.id)} className='flex flex-col items-center gap-1'>
              <svg
                width='30'
                height='30'
                viewBox='0 0 48 48'
                fill={likeState[v.id]?.liked ?? !!v.isLiked ? '#fe2c55' : 'none'}
                stroke={likeState[v.id]?.liked ?? !!v.isLiked ? '#fe2c55' : 'white'}
                strokeWidth='3'
              >
                <path d='M24 9.44c3.2-4.03 7.61-5.56 12-4.67 2.31.47 5.59 2.28 7.75 5.48 2.26 3.32 3.21 7.99.98 13.85-1.75 4.57-5.5 8.83-9.28 12.2a56.6 56.6 0 0 1-10.52 7.47l-.93.49-.93-.49a56.6 56.6 0 0 1-10.52-7.47c-3.78-3.37-7.53-7.63-9.28-12.2-2.24-5.86-1.28-10.53.98-13.85C6.4 7.05 9.69 5.24 12 4.77c4.39-.9 8.8.64 12 4.67Z' />
              </svg>
              <span className='text-xs font-semibold'>
                {formatCount(likeState[v.id]?.count ?? v.likeCount ?? 0)}
              </span>
            </button>

            {/* Comment */}
            <button className='flex flex-col items-center gap-1'>
              <svg width='30' height='30' viewBox='0 0 48 48' fill='white'>
                <path fillRule='evenodd' clipRule='evenodd' d='M2 21.5c0-10.22 9.88-18 22-18s22 7.78 22 18c0 5.63-3.19 10.74-7.32 14.8a43.55 43.55 0 0 1-14.14 9.1A1.5 1.5 0 0 1 22.5 44v-5.04C11.13 38.4 2 31.34 2 21.5ZM14 25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' />
              </svg>
              <span className='text-xs font-semibold'>0</span>
            </button>

            {/* Favorite (bookmark) */}
            <button className='flex flex-col items-center gap-1'>
              <svg width='30' height='30' viewBox='0 0 48 48' fill='white'>
                <path d='M13 4a5 5 0 0 0-5 5v32.8a2 2 0 0 0 3.26 1.55l12.1-9.84a1 1 0 0 1 1.27 0l12.1 9.84A2 2 0 0 0 40 41.8V9a5 5 0 0 0-5-5H13Z' />
              </svg>
              <span className='text-xs font-semibold'>0</span>
            </button>

            {/* Share */}
            <button className='flex flex-col items-center gap-1'>
              <svg width='30' height='30' viewBox='0 0 48 48' fill='white'>
                <path d='M23.82 3.5A2 2 0 0 0 20.5 5v10.06C8.7 15.96 1 25.32 1 37a2 2 0 0 0 3.41 1.41c4.14-4.13 10.4-5.6 16.09-5.88v9.97a2 2 0 0 0 3.3 1.52l21.5-18.5a2 2 0 0 0 .02-3.02z' />
              </svg>
              <span className='text-xs font-semibold'>0</span>
            </button>

            {/* Music disc */}
            <div className='w-11 h-11 rounded-full border border-white/30 overflow-hidden animate-spin' style={{ animationDuration: '4s' }}>
              <img src={v.thumbnailUrl || v.splashImageUrl} alt='' className='w-full h-full object-cover' />
            </div>
          </div>

          {/* Thông tin dưới trái (author + caption + nhạc) */}
          <div className='absolute bottom-4 left-4 right-20 z-10 text-white'>
            <p className='font-semibold'>@{v.userFullName}</p>
            <p className='text-sm opacity-90 line-clamp-2 mt-1'>{v.title}</p>
            <div className='flex items-center gap-2 mt-2 text-xs opacity-90'>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z' />
              </svg>
              <span className='truncate'>Âm thanh gốc - {v.userFullName}</span>
            </div>
          </div>

          {/* Nút mute */}
          <button
            onClick={() => setMuted((m) => !m)}
            className='absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center'
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Thoát về trang chủ */}
          <Link
            href='/'
            className='absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center'
          >
            ✕
          </Link>
        </section>
      ))}

      {loading && (
        <div className='h-[100dvh] w-full flex items-center justify-center bg-black'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-accent' />
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <div className='h-[100dvh] w-full flex flex-col items-center justify-center bg-black text-white gap-3'>
          <p className='opacity-70'>Bạn đã xem hết video 🎉</p>
          <button
            onClick={() => {
              setVideos([]);
              setLastCreatedAt(undefined);
              setHasMore(true);
            }}
            className='px-4 py-2 rounded-full bg-accent text-white'
          >
            Xem lại từ đầu
          </button>
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className='h-[100dvh] w-full flex flex-col items-center justify-center bg-black text-white gap-3'>
          <p className='opacity-70'>Chưa có video nào</p>
          <Link href='/' className='px-4 py-2 rounded-full bg-accent text-white'>
            Về trang chủ
          </Link>
        </div>
      )}
    </div>
  );
}
