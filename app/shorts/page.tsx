'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import videoApi from '@/lib/apis/video.api';
import { subscriptionApi } from '@/lib/apis/subscription.api';
import commentApi from '@/lib/apis/comment.api';
import { useAuth } from '@/lib/hooks/useAuth';
import { openAuthModal } from '@/components/auth/AuthProvider';
import CommentSection from '@/components/video/CommentSection';
import type { ShortsResponse } from '@/types';

const PAGE_SIZE = 10;
const MARK_WATCHED_DELAY = 3000; // ms: đánh dấu đã xem sau khi xem 3s

// Sinh guest id: ưu tiên crypto.randomUUID (chỉ có trong secure context HTTPS),
// fallback UUID v4 thủ công cho trình duyệt cũ / truy cập qua HTTP (VD: IP LAN)
const generateGuestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function ShortsPage() {
  const [videos, setVideos] = useState<ShortsResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loopMode, setLoopMode] = useState(false); // false: lượt đầu loại trừ đã xem; true: lặp vô hạn
  const [lastCreatedAt, setLastCreatedAt] = useState<string | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeId = activeIndex != null ? (videos[activeIndex]?.id ?? null) : null;
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [guestId, setGuestId] = useState<string | undefined>(undefined);
  const [likeState, setLikeState] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [followState, setFollowState] = useState<Record<string, boolean>>({});
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Lấy số lượng bình luận của video đang active để hiển thị trên nút
  useEffect(() => {
    if (!activeId || commentCounts[activeId] !== undefined) return;
    commentApi
      .getVideoComments(activeId, 0, 1)
      .then((data) => setCommentCounts((prev) => ({ ...prev, [activeId]: data.totalElements ?? 0 })))
      .catch(() => {});
  }, [activeId, commentCounts]);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const { isAuthenticated } = useAuth();

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Guest id cho người dùng chưa đăng nhập (lưu localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let id = localStorage.getItem('guestId');
    if (!id) {
      id = generateGuestId();
      localStorage.setItem('guestId', id);
    }
    setGuestId(id);
  }, []);

  const loadMore = useCallback(async (opts: { reset?: boolean; loop?: boolean } = {}) => {
    const reset = opts.reset ?? false;
    const loop = opts.loop ?? loopMode;
    if (loading) return;
    if (!reset && !hasMore) return;
    setLoading(true);
    try {
      const cursor = reset ? undefined : lastCreatedAt;
      const data = await videoApi.getShorts({
        size: PAGE_SIZE,
        lastCreatedAt: cursor,
        guestId,
        loop,
      });
      if (data.length < PAGE_SIZE) setHasMore(false);
      else setHasMore(true);
      if (data.length > 0) {
        setLastCreatedAt(data[data.length - 1].createdAt);
      }
      setVideos((prev) => [...prev, ...data]);
    } catch (e) {
      console.error('Lỗi tải shorts:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastCreatedAt, guestId, loopMode]);

  // Tải trang đầu (loại trừ đã xem). Chỉ chạy 1 lần.
  const didInit = useRef(false);
  useEffect(() => {
    if (guestId && !didInit.current) {
      didInit.current = true;
      loadMore();
    }
  }, [guestId, loadMore]);

  // Nếu lượt đầu (exclude) trả rỗng (đã xem hết từ trước) thì chuyển sang
  // loopMode để hiện lại video đã xem, tránh màn hình "Chưa có video".
  useEffect(() => {
    if (!loading && videos.length === 0 && !loopMode) {
      setLoopMode(true);
      setHasMore(true);
      setLastCreatedAt(undefined);
      loadMore({ reset: true, loop: true });
    }
  }, [loading, videos.length, loopMode, loadMore]);

  // IntersectionObserver: xác định video đang active
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
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
    setPurchaseError(null);
    setBuffering(false);
  }, [activeIndex]);

  // Play active, pause others (tôn trọng trạng thái paused của user)
  const activeVideo = videos.find((v) => v.id === activeId);
  const activeLocked = !!activeVideo?.isPaid && !activeVideo?.purchased && !activeVideo?.isOwner;

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      const isActive = i === activeIndex;
      if (isActive && !activeLocked) {
        if (paused) {
          v.pause();
        } else {
          v.play().catch(() => {});
        }
      } else {
        v.pause();
      }
    });
  }, [activeIndex, paused, activeLocked]);

  // Đánh dấu đã xem + tăng view khi active đủ lâu (bỏ qua video có phí chưa mua)
  useEffect(() => {
    if (!activeId) return;
    const v = videos.find((x) => x.id === activeId);
    if (v?.isPaid && !v?.purchased) return;
    const timer = setTimeout(() => {
      videoApi.markWatched(activeId, guestId);
      videoApi.incrementViews(activeId).catch(() => {});
    }, MARK_WATCHED_DELAY);
    return () => clearTimeout(timer);
  }, [activeId, guestId, videos]);

  // Mua video có phí (yêu cầu đăng nhập)
  const handlePurchase = async (id: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setPurchaseError(null);
    try {
      await videoApi.purchaseVideo(id);
      setVideos((prev) => prev.map((x) => (x.id === id ? { ...x, purchased: true } : x)));
    } catch (e) {
      const res = (e as { response?: { data?: { message?: string } } })?.response;
      setPurchaseError(res?.data?.message || 'Mua video thất bại, vui lòng thử lại');
      console.error('Lỗi mua video:', e);
    }
  };

  // Infinite scroll: khi gần cuối thì load thêm. Lượt đầu (loopMode=false) loại
  // trừ video đã xem. Khi thực sự hết (hasMore=false) thì bật loopMode và quay
  // vòng từ đầu để feed lặp vô hạn.
  useEffect(() => {
    if (activeIndex == null || loading) return;
    if (activeIndex < videos.length - 3) return;
    if (!hasMore) {
      setLoopMode(true);
      setHasMore(true);
      setLastCreatedAt(undefined);
      loadMore({ reset: true, loop: true });
    } else {
      loadMore({ loop: loopMode });
    }
  }, [activeIndex, videos, hasMore, loading, loadMore, loopMode]);

  const setVideoRef = (index: number) => (el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el;
  };

  // Format số lượng kiểu TikTok: 138.9K, 2.1M
  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };

  const toggleLike = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      openAuthModal('login');
      return;
    }
    const v = videos.find((x) => x.id === id);
    const base = likeState[id] ?? { liked: !!v?.isLiked, count: v?.likeCount ?? 0 };
    const willLike = !base.liked;

    // Cập nhật tối ưu (optimistic)
    setLikeState((prev) => ({ ...prev, [id]: { liked: willLike, count: base.count + (willLike ? 1 : -1) } }));

    try {
      const res = await videoApi.toggleReaction(id, 'LIKE');
      // Đồng bộ với dữ liệu thực từ server
      setLikeState((prev) => ({ ...prev, [id]: { liked: res.userReaction === 'LIKE', count: res.likeCount } }));
    } catch (e) {
      // Hoàn tác nếu lỗi
      setLikeState((prev) => ({ ...prev, [id]: base }));
      console.error('Lỗi thích video:', e);
    }
  };

  // Lấy danh sách kênh đã theo dõi để hiển thị trạng thái nút Theo dõi
  useEffect(() => {
    if (!isAuthenticated) return;
    subscriptionApi
      .getMySubscriptions()
      .then((ids) => {
        const map: Record<string, boolean> = {};
        ids.forEach((id) => {
          map[id] = true;
        });
        setFollowState(map);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Theo dõi / bỏ theo dõi kênh
  const handleFollow = async (channelId: string) => {
    if (!channelId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      openAuthModal('login');
      return;
    }
    const currentlyFollowing = !!followState[channelId];
    // Cập nhật tối ưu (optimistic)
    setFollowState((prev) => ({ ...prev, [channelId]: !currentlyFollowing }));
    try {
      if (currentlyFollowing) {
        await subscriptionApi.unsubscribe(channelId);
      } else {
        await subscriptionApi.subscribe(channelId);
      }
    } catch (e) {
      // Hoàn tác nếu lỗi
      setFollowState((prev) => ({ ...prev, [channelId]: currentlyFollowing }));
      console.error('Lỗi theo dõi kênh:', e);
    }
  };

  // Chia sẻ video: dùng Web Share API nếu có, ngược lại copy link
  const handleShare = async (video: ShortsResponse) => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/watch/${video.slug || video.id}`;
    const shareData = {
      title: video.title || 'Xem video trên WVideos',
      text: video.title || '',
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Người dùng huỷ hoặc không hỗ trợ -> fallback copy link
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback('Đã sao chép link chia sẻ!');
    } catch {
      setShareFeedback('Không thể sao chép link');
    }
    setTimeout(() => setShareFeedback(null), 2000);
  };

  return (
    <div className='h-[100dvh] w-full bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide' ref={containerRef}>
      {videos.map((v, index) => (
        <section
          key={`${v.id}-${index}`}
          data-id={v.id}
          data-index={index}
          className='relative h-[100dvh] w-full snap-start flex items-center justify-center bg-black'
        >
          {v.isPaid && !v.purchased && !v.isOwner ? (
            <>
              <img
                src={v.thumbnailUrl || v.splashImageUrl}
                alt=''
                className='absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-60'
              />
              <div className='relative z-10 flex flex-col items-center justify-center text-white px-6 text-center'>
                <div className='w-16 h-16 rounded-full bg-black/50 flex items-center justify-center mb-4'>
                  <svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2'>
                    <rect x='5' y='11' width='14' height='9' rx='2' />
                    <path d='M8 11V8a4 4 0 0 1 8 0v3' />
                  </svg>
                </div>
                <p className='text-lg font-semibold'>Video có phí</p>
                <p className='opacity-80 mt-1'>{(v.price ?? 0).toLocaleString('vi-VN')} VNĐ</p>
                {v.isOwner ? (
                  <p className='mt-4 px-6 py-2 rounded-full bg-white/20'>Video của bạn</p>
                ) : (
                  <>
                    <button
                      onClick={() => handlePurchase(v.id)}
                      className='mt-4 px-6 py-2 rounded-full bg-accent text-white font-medium hover:opacity-90 transition-opacity'
                    >
                      Mua ngay
                    </button>
                    {purchaseError && (
                      <p className='mt-3 text-sm text-red-400'>{purchaseError}</p>
                    )}
                  </>
                )}
              </div>
            </>
          ) : v.streamUrl ? (
            <>
              <video
                ref={setVideoRef(index)}
                src={v.streamUrl}
                className='h-full w-full object-contain'
                muted={muted}
                loop
                playsInline
                preload='auto'
                onClick={() => setPaused((p) => !p)}
                onLoadStart={() => setBuffering(true)}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                onCanPlay={() => setBuffering(false)}
                onLoadedData={() => setBuffering(false)}
              />
              {buffering && activeId === v.id && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/60 z-[6]'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-accent' />
                </div>
              )}
            </>
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

          {/* Scrim tăng độ tương phản cho text và action bar (đặc biệt video ngang) */}
          <div className='absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-[5]' />
          <div className='absolute top-0 bottom-0 right-0 w-44 bg-gradient-to-l from-black/70 via-black/20 to-transparent pointer-events-none z-[5]' />

          {/* Thanh action bar bên phải (style TikTok) */}
          <div className='absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5 text-white'>
            {/* Avatar + follow */}
            <div className='relative'>
              <img
                src={v.avatarUrl || v.thumbnailUrl || v.splashImageUrl}
                alt={v.userFullName}
                className='w-12 h-12 rounded-full object-cover border-2 border-white'
              />
              {!v.isOwner && v.userId && (
                <button
                  onClick={() => handleFollow(v.userId!)}
                  className='absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-sm leading-none'
                  aria-label={followState[v.userId] ? 'Bỏ theo dõi' : 'Theo dõi'}
                  title={followState[v.userId] ? 'Bỏ theo dõi' : 'Theo dõi'}
                >
                  {followState[v.userId] ? '✓' : '+'}
                </button>
              )}
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
            <button
              onClick={() => setCommentVideoId((prev) => (prev === v.id ? null : v.id))}
              className={`flex flex-col items-center gap-1 ${commentVideoId === v.id ? 'opacity-100' : 'opacity-90'}`}
            >
              <svg width='30' height='30' viewBox='0 0 48 48' fill='white'>
                <path fillRule='evenodd' clipRule='evenodd' d='M2 21.5c0-10.22 9.88-18 22-18s22 7.78 22 18c0 5.63-3.19 10.74-7.32 14.8a43.55 43.55 0 0 1-14.14 9.1A1.5 1.5 0 0 1 22.5 44v-5.04C11.13 38.4 2 31.34 2 21.5ZM14 25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' />
              </svg>
              <span className='text-xs font-semibold'>{commentCounts[v.id] ?? 0}</span>
            </button>

            {/* Share */}
            <button onClick={() => handleShare(v)} className='flex flex-col items-center gap-1'>
              <svg width='30' height='30' viewBox='0 0 48 48' fill='white'>
                <path d='M23.82 3.5A2 2 0 0 0 20.5 5v10.06C8.7 15.96 1 25.32 1 37a2 2 0 0 0 3.41 1.41c4.14-4.13 10.4-5.6 16.09-5.88v9.97a2 2 0 0 0 3.3 1.52l21.5-18.5a2 2 0 0 0 .02-3.02z' />
              </svg>
              <span className='text-xs font-semibold'>Chia sẻ</span>
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

      {!loading && videos.length === 0 && loopMode && (
        <div className='h-[100dvh] w-full flex flex-col items-center justify-center bg-black text-white gap-3'>
          <p className='opacity-70'>Chưa có video nào</p>
          <Link href='/' className='px-4 py-2 rounded-full bg-accent text-white'>
            Về trang chủ
          </Link>
        </div>
      )}

      {/* Panel bình luận bên phải */}
      {commentVideoId && (
        <div className='fixed top-0 right-0 z-50 h-[100dvh] w-full sm:w-[400px] bg-primary border-l border-accent shadow-2xl flex flex-col'>
          <div className='flex items-center justify-between p-4 border-b border-accent shrink-0'>
            <h3 className='font-semibold text-foreground'>Bình luận</h3>
            <button
              onClick={() => {
                setCommentCounts((prev) => {
                  const next = { ...prev };
                  delete next[commentVideoId];
                  return next;
                });
                setCommentVideoId(null);
              }}
              className='w-8 h-8 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors'
              aria-label='Đóng'
            >
              ✕
            </button>
          </div>
          <div className='flex-1 overflow-y-auto p-4'>
            <CommentSection videoId={commentVideoId} />
          </div>
        </div>
      )}

      {/* Toast thông báo chia sẻ */}
      {shareFeedback && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-black/85 text-white px-5 py-2.5 rounded-full text-sm shadow-lg'>
          {shareFeedback}
        </div>
      )}
    </div>
  );
}
