'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import searchApi from '@/lib/apis/search.api';
import type { VideoResponse } from '@/types';
import type { NewsResponse } from '@/lib/apis/news.api';

/**
 * Ô tìm kiếm thông minh trên header:
 * - Gợi ý live (debounce 300ms): video + kênh + tin tức
 * - Điều hướng bằng bàn phím (↑↓ Enter Esc)
 * - Enter / nút tìm → trang kết quả đầy đủ /search?q=
 */

type SuggestItem = {
  type: 'video' | 'channel' | 'news' | 'all';
  href: string;
  // dữ liệu hiển thị tùy loại
  video?: VideoResponse;
  channel?: { id: string; fullName: string; avatar?: string; channelSlug?: string };
  news?: NewsResponse;
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

// Định dạng gọn lượt xem: 1.2N, 3.4tr...
function formatViews(views?: number): string {
  if (!views) return '0';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)} tỷ`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)} tr`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}N`;
  return String(views);
}

// Định dạng thời lượng mm:ss
function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function HeaderSearch({
  autoFocus = false,
  rounded = false,
  onClose,
}: {
  autoFocus?: boolean;
  rounded?: boolean; // style input bo tròn (mobile)
  onClose?: () => void; // đóng thanh search mobile
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggest, setSuggest] = useState<{ videos: VideoResponse[]; channels: { id: string; fullName: string; avatar?: string; channelSlug?: string }[]; news: NewsResponse[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLFormElement | null>(null);
  const requestIdRef = useRef(0);

  // Gọi API gợi ý sau khi ngừng gõ 300ms (bỏ qua request cũ nếu query thay đổi tiếp)
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setSuggest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      try {
        const data = await searchApi.suggest(q);
        if (requestId !== requestIdRef.current) return; // request đã lỗi thời
        setSuggest(data);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch {
        // Lỗi mạng/token -> im lặng, vẫn cho submit thủ công
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Danh sách item dẹt để điều hướng bàn phím (kèm mục "xem tất cả" ở cuối)
  const items: SuggestItem[] = [];
  if (suggest) {
    suggest.videos.forEach((v) =>
      items.push({ type: 'video', href: `/watch/${v.slug || v.id}`, video: v })
    );
    suggest.channels.forEach((c) =>
      items.push({ type: 'channel', href: `/channel/${c.channelSlug || c.id}`, channel: c })
    );
    suggest.news.forEach((n) => items.push({ type: 'news', href: `/news/${n.id}`, news: n }));
  }
  const hasAnyResult = items.length > 0;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const goToResults = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }, [query, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showDropdown && hasAnyResult) setShowDropdown(true);
      setActiveIndex((i) => Math.min(i + 1, items.length)); // index items.length = mục "xem tất cả"
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = activeIndex >= 0 ? items[activeIndex] : null;
      if (item) {
        setShowDropdown(false);
        router.push(item.href);
      } else {
        goToResults();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const highlight = (i: number) =>
    `block cursor-pointer transition-colors ${activeIndex === i ? 'bg-secondary' : 'hover:bg-secondary'}`;

  const inputClasses = rounded
    ? 'w-full px-4 py-2.5 bg-secondary text-foreground placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-accent'
    : 'w-full px-4 py-2 bg-secondary text-foreground placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-accent';

  return (
    <form
      ref={rootRef}
      onSubmit={(e) => {
        e.preventDefault();
        goToResults();
      }}
      className='relative flex-1'
    >
      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= MIN_QUERY_LENGTH && suggest && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder='Tìm kiếm video, kênh, tin tức...'
        autoFocus={autoFocus}
        className={inputClasses}
      />

      {/* Nút tìm / đóng (mobile) */}
      <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
        {loading && (
          <span className='w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin' aria-label='Đang tìm' />
        )}
        {onClose && !query && (
          <button
            type='button'
            onClick={onClose}
            className='p-1.5 rounded-full text-foreground hover:bg-secondary transition-colors'
            aria-label='Đóng tìm kiếm'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        )}
        <button
          type='submit'
          className='p-1.5 rounded-full text-foreground hover:bg-secondary transition-colors'
          aria-label='Tìm kiếm'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
          </svg>
        </button>
      </div>

      {/* Dropdown gợi ý */}
      {showDropdown && query.trim().length >= MIN_QUERY_LENGTH && (
        <div className='absolute left-0 right-0 top-full mt-2 z-50 bg-primary border border-secondary rounded-lg shadow-2xl max-h-[70vh] overflow-y-auto'>
          {!hasAnyResult && !loading && (
            <p className='px-4 py-6 text-center text-sm text-foreground opacity-60'>
              Không tìm thấy kết quả cho &quot;{query.trim()}&quot;
            </p>
          )}

          {hasAnyResult && (
            <>
              {/* Videos */}
              {suggest!.videos.length > 0 && (
                <div>
                  <p className='px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-foreground opacity-50'>
                    Video
                  </p>
                  {suggest!.videos.map((v, i) => (
                    <Link
                      key={v.id}
                      href={`/watch/${v.slug || v.id}`}
                      onClick={() => setShowDropdown(false)}
                      className={highlight(i)}
                    >
                      <span className='flex items-center gap-3 px-4 py-2'>
                        <img
                          src={v.thumbnailUrl || v.splashImageUrl}
                          alt=''
                          className='w-16 h-9 object-cover rounded bg-secondary flex-shrink-0'
                        />
                        <span className='min-w-0 flex-1'>
                          <span className='block text-sm font-medium text-foreground truncate'>{v.title}</span>
                          <span className='block text-xs text-foreground opacity-60'>
                            {v.userFullName} • {formatViews(v.views)} lượt xem
                          </span>
                        </span>
                        <span className='text-xs text-foreground opacity-50 flex-shrink-0'>{formatDuration(v.duration)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Kênh */}
              {suggest!.channels.length > 0 && (
                <div className='border-t border-secondary'>
                  <p className='px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-foreground opacity-50'>
                    Kênh
                  </p>
                  {suggest!.channels.map((c, i) => {
                    const idx = suggest!.videos.length + i;
                    return (
                      <Link
                        key={c.id}
                        href={`/channel/${c.channelSlug || c.id}`}
                        onClick={() => setShowDropdown(false)}
                        className={highlight(idx)}
                      >
                        <span className='flex items-center gap-3 px-4 py-2'>
                          {c.avatar ? (
                            <img src={c.avatar} alt='' className='w-8 h-8 rounded-full object-cover bg-secondary flex-shrink-0' />
                          ) : (
                            <span className='w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0'>
                              {(c.fullName || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className='min-w-0'>
                            <span className='block text-sm font-medium text-foreground truncate'>{c.fullName}</span>
                            <span className='block text-xs text-foreground opacity-60'>Kênh</span>
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Tin tức */}
              {suggest!.news.length > 0 && (
                <div className='border-t border-secondary'>
                  <p className='px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-foreground opacity-50'>
                    Tin tức
                  </p>
                  {suggest!.news.map((n, i) => {
                    const idx = suggest!.videos.length + suggest!.channels.length + i;
                    return (
                      <Link
                        key={n.id}
                        href={`/news/${n.id}`}
                        onClick={() => setShowDropdown(false)}
                        className={highlight(idx)}
                      >
                        <span className='flex items-center gap-3 px-4 py-2'>
                          {n.thumbnailUrl ? (
                            <img src={n.thumbnailUrl} alt='' className='w-16 h-9 object-cover rounded bg-secondary flex-shrink-0' />
                          ) : (
                            <span className='w-16 h-9 rounded bg-secondary flex items-center justify-center text-lg flex-shrink-0'>📰</span>
                          )}
                          <span className='min-w-0'>
                            <span className='block text-sm font-medium text-foreground truncate'>{n.title}</span>
                            <span className='block text-xs text-foreground opacity-60 truncate'>{n.summary}</span>
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Xem tất cả */}
              <button
                type='button'
                onClick={goToResults}
                onMouseEnter={() => setActiveIndex(items.length)}
                className={`${highlight(items.length)} w-full text-left border-t border-secondary`}
              >
                <span className='flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-accent'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                  Xem tất cả kết quả cho &quot;{query.trim()}&quot;
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
