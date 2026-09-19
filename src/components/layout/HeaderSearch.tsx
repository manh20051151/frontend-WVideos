'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import searchApi, { SearchHistoryItem } from '@/lib/apis/search.api';
import { useAuth } from '@/lib/hooks/useAuth';
import type { VideoResponse } from '@/types';
import type { NewsResponse } from '@/lib/apis/news.api';

/**
 * Ô tìm kiếm thông minh trên header (giống YouTube):
 * - Focus ô trống → hiện "Tìm kiếm gần đây" (xóa từng mục / xóa tất cả)
 * - Gõ từ khóa → gợi ý live (debounce 300ms): lịch sử khớp + video + kênh + tin tức
 * - Lịch sử: user đăng nhập lưu server (đồng bộ thiết bị), khách lưu localStorage
 * - Điều hướng bàn phím (↑↓ Enter Esc)
 */

type SuggestItem = {
  type: 'history' | 'video' | 'channel' | 'news' | 'all';
  href: string;
  video?: VideoResponse;
  channel?: { id: string; fullName: string; avatar?: string; channelSlug?: string };
  news?: NewsResponse;
  history?: SearchHistoryItem;
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const LOCAL_HISTORY_KEY = 'searchHistory';
const LOCAL_HISTORY_MAX = 10;

// ===== Lịch sử cho khách (localStorage) =====

function readLocalHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const arr = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((q): q is string => typeof q === 'string')
      .map((q, i) => ({ id: -(i + 1), query: q }));
  } catch {
    return [];
  }
}

function writeLocalHistory(queries: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(queries.slice(0, LOCAL_HISTORY_MAX)));
}

function pushLocalHistory(query: string) {
  const q = query.trim();
  if (!q) return;
  const rest = readLocalHistory().map((h) => h.query).filter((x) => x.toLowerCase() !== q.toLowerCase());
  writeLocalHistory([q, ...rest]);
}

// ===== Định dạng hiển thị =====

function formatViews(views?: number): string {
  if (!views) return '0';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)} tỷ`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)} tr`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}N`;
  return String(views);
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Icon đồng hồ (mục lịch sử)
const ClockIcon = () => (
  <svg className='w-4 h-4 flex-shrink-0 opacity-60' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
  </svg>
);

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
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [suggest, setSuggest] = useState<{ videos: VideoResponse[]; channels: { id: string; fullName: string; avatar?: string; channelSlug?: string }[]; news: NewsResponse[] } | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLFormElement | null>(null);
  const requestIdRef = useRef(0);

  const trimmedQuery = query.trim();

  // ===== Tải lịch sử (server cho user đăng nhập, localStorage cho khách) =====
  const loadHistory = useCallback(async () => {
    try {
      if (isAuthenticated) {
        setHistory(await searchApi.getHistory(10));
      } else {
        setHistory(readLocalHistory());
      }
    } catch {
      setHistory([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ===== Gợi ý live sau khi ngừng gõ 300ms =====
  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSuggest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      try {
        const data = await searchApi.suggest(trimmedQuery);
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
  }, [trimmedQuery]);

  // ===== Danh sách item dẹt để điều hướng bàn phím =====
  // Đang gõ: lịch sử khớp + video + kênh + tin + "xem tất cả"
  // Ô trống: toàn bộ lịch sử
  const items: SuggestItem[] = [];
  let historyMatches: SearchHistoryItem[] = [];
  if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
    const lower = trimmedQuery.toLowerCase();
    // Đang gõ: chỉ hiện tối đa 3 mục lịch sử khớp, tránh đẩy gợi ý live xuống quá xa
    historyMatches = history.filter((h) => h.query.toLowerCase().includes(lower)).slice(0, 3);
  } else {
    historyMatches = history.slice(0, 10);
  }

  if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
    historyMatches.forEach((h) =>
      items.push({ type: 'history', href: `/search?q=${encodeURIComponent(h.query)}`, history: h })
    );
    suggest?.videos.forEach((v) =>
      items.push({ type: 'video', href: `/watch/${v.slug || v.id}`, video: v })
    );
    suggest?.channels.forEach((c) =>
      items.push({ type: 'channel', href: `/channel/${c.channelSlug || c.id}`, channel: c })
    );
    suggest?.news.forEach((n) => items.push({ type: 'news', href: `/news/${n.id}`, news: n }));
  } else {
    historyMatches.forEach((h) =>
      items.push({ type: 'history', href: `/search?q=${encodeURIComponent(h.query)}`, history: h })
    );
  }

  // ===== Lưu lịch sử khi thực hiện tìm kiếm =====
  const saveQuery = useCallback(
    (q: string) => {
      const keyword = q.trim();
      if (!keyword) return;
      if (isAuthenticated) {
        searchApi.saveHistory(keyword).catch(() => {});
      } else {
        pushLocalHistory(keyword);
        setHistory(readLocalHistory());
      }
    },
    [isAuthenticated]
  );

  const goToResults = useCallback(
    (q: string) => {
      const keyword = q.trim();
      if (!keyword) return;
      saveQuery(keyword);
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(keyword)}`);
    },
    [router, saveQuery]
  );

  // ===== Xóa lịch sử =====
  const removeHistoryItem = useCallback(
    async (item: SearchHistoryItem, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isAuthenticated && item.id > 0) {
        try {
          await searchApi.deleteHistoryItem(item.id);
        } catch {
          return;
        }
        setHistory((prev) => prev.filter((h) => h.id !== item.id));
      } else {
        const remaining = readLocalHistory()
          .map((h) => h.query)
          .filter((q) => q.toLowerCase() !== item.query.toLowerCase());
        writeLocalHistory(remaining);
        setHistory(readLocalHistory());
      }
    },
    [isAuthenticated]
  );

  const clearAllHistory = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await searchApi.clearHistory();
      } catch {
        return;
      }
      setHistory([]);
    } else {
      writeLocalHistory([]);
      setHistory([]);
    }
  }, [isAuthenticated]);

  // ===== Đóng dropdown khi click ra ngoài =====
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // ===== Bàn phím =====
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showDropdown && items.length > 0) setShowDropdown(true);
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = activeIndex >= 0 ? items[activeIndex] : null;
      if (item) {
        if (item.type === 'history') {
          goToResults(item.history!.query);
        } else {
          setShowDropdown(false);
          router.push(item.href);
        }
      } else {
        goToResults(query);
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

  const isTyping = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const showHistoryList = !isTyping && historyMatches.length > 0;

  return (
    <form
      ref={rootRef}
      onSubmit={(e) => {
        e.preventDefault();
        goToResults(query);
      }}
      className='relative flex-1'
    >
      <input
        type='text'
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          loadHistory();
          if (!isTyping && historyMatches.length > 0) setShowDropdown(true);
          else if (isTyping && suggest) setShowDropdown(true);
        }}
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

      {/* ===== Dropdown ===== */}
      {showDropdown && (showHistoryList || isTyping) && (
        <div className='absolute left-0 right-0 top-full mt-2 z-50 bg-primary border border-secondary rounded-lg shadow-2xl max-h-[70vh] overflow-y-auto'>
          {/* Lịch sử tìm kiếm (ô trống hoặc khớp từ khóa) */}
          {historyMatches.length > 0 && (
            <div className={isTyping ? '' : 'pb-2'}>
              <div className='flex items-center justify-between px-4 pt-3 pb-1'>
                <p className='text-xs font-semibold uppercase tracking-wider text-foreground opacity-50'>
                  {isTyping ? 'Gần đây' : 'Tìm kiếm gần đây'}
                </p>
                {!isTyping && (
                  <button
                    type='button'
                    onClick={clearAllHistory}
                    className='text-xs font-medium text-accent hover:opacity-80'
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              {historyMatches.map((h, i) => (
                <div key={`${h.id}-${h.query}`} className={`${highlight(i)} relative group`}>
                  <Link
                    href={`/search?q=${encodeURIComponent(h.query)}`}
                    onClick={() => {
                      saveQuery(h.query);
                      setShowDropdown(false);
                    }}
                    className='flex items-center gap-3 px-4 py-2 pr-11'
                  >
                    <ClockIcon />
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm text-foreground truncate'>{h.query}</span>
                    </span>
                  </Link>
                  <button
                    type='button'
                    onClick={(e) => removeHistoryItem(h, e)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-foreground opacity-40 hover:opacity-100 hover:bg-secondary transition-opacity'
                    aria-label={`Xóa "${h.query}" khỏi lịch sử`}
                  >
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Đang gõ: gợi ý live */}
          {isTyping && (
            <>
              {!loading && items.length === 0 && (
                <p className='px-4 py-6 text-center text-sm text-foreground opacity-60'>
                  Không tìm thấy kết quả cho &quot;{trimmedQuery}&quot;
                </p>
              )}

              {/* Videos */}
              {suggest && suggest.videos.length > 0 && (
                <div className={historyMatches.length > 0 ? 'border-t border-secondary' : ''}>
                  <p className='px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-foreground opacity-50'>
                    Video
                  </p>
                  {suggest.videos.map((v) => {
                    const idx = historyMatches.length + suggest.videos.indexOf(v);
                    return (
                      <Link
                        key={v.id}
                        href={`/watch/${v.slug || v.id}`}
                        onClick={() => setShowDropdown(false)}
                        className={highlight(idx)}
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
                    );
                  })}
                </div>
              )}

              {/* Kênh */}
              {suggest && suggest.channels.length > 0 && (
                <div className='border-t border-secondary'>
                  <p className='px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-foreground opacity-50'>
                    Kênh
                  </p>
                  {suggest.channels.map((c, i) => {
                    const idx = historyMatches.length + (suggest.videos?.length ?? 0) + i;
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
              {suggest && suggest.news.length > 0 && (
                <div className='border-t border-secondary'>
                  <p className='px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-foreground opacity-50'>
                    Tin tức
                  </p>
                  {suggest.news.map((n, i) => {
                    const idx =
                      historyMatches.length + (suggest.videos?.length ?? 0) + (suggest.channels?.length ?? 0) + i;
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
                onClick={() => goToResults(query)}
                onMouseEnter={() => setActiveIndex(items.length - 1)}
                className={`${highlight(items.length - 1)} w-full text-left border-t border-secondary`}
              >
                <span className='flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-accent'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                  Xem tất cả kết quả cho &quot;{trimmedQuery}&quot;
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
