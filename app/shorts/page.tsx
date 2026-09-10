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
  const [guestId, setGuestId] = useState<string | undefined>(undefined);

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

  // Play active, pause others
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      const section = v.closest('[data-id]');
      if (section && section.getAttribute('data-id') === activeId) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [activeId]);

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

  return (
    <div className='h-[100dvh] w-full bg-black overflow-y-scroll snap-y snap-mandatory' ref={containerRef}>
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
            />
          ) : (
            <div className='flex flex-col items-center text-white'>
              <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-3' />
              <p className='opacity-70'>Không thể tải video</p>
            </div>
          )}

          {/* Overlay thông tin */}
          <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white'>
            <p className='font-semibold'>{v.userFullName}</p>
            <p className='text-sm opacity-80 line-clamp-2'>{v.title}</p>
            <p className='text-xs opacity-60 mt-1'>
              {v.views?.toLocaleString('vi-VN')} lượt xem
            </p>
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
