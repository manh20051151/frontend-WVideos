'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, type AppNotification } from '@/lib/hooks/useNotifications';
import { subscriptionApi } from '@/lib/apis/subscription.api';

const svgProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const TYPE_ICON: Record<AppNotification['type'], ReactNode> = {
  COMMENT: (
    <svg {...svgProps}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  SUBSCRIBE: (
    <svg {...svgProps}>
      <path d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.75 19.5h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
    </svg>
  ),
  PURCHASE: (
    <svg {...svgProps}>
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 8v1m-6 4h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
    </svg>
  ),
  LIKE: (
    <svg {...svgProps}>
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  ),
  NEW_VIDEO: (
    <svg {...svgProps}>
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
    </svg>
  ),
  ANNOUNCEMENT: (
    <svg {...svgProps}>
      <path d="M3 11l18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  COMMENT_BANNED: (
    <svg {...svgProps}>
      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z" />
    </svg>
  ),
};

const formatRelativeTime = (iso?: string): string => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'vừa xong';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk} tuần trước`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} tháng trước`;
  return `${Math.floor(day / 365)} năm trước`;
};

const isVideoType = (t: AppNotification['type']) =>
  t === 'NEW_VIDEO' || t === 'COMMENT' || t === 'PURCHASE' || t === 'LIKE';

type Filter = 'all' | 'unread';

function NotificationAvatar({ n }: { n: AppNotification }) {
  const [avatarError, setAvatarError] = useState(false);

  return n.avatarUrl && !avatarError ? (
    <img
      src={n.avatarUrl}
      alt=''
      onError={() => setAvatarError(true)}
      className='w-10 h-10 rounded-full object-cover bg-secondary shrink-0'
    />
  ) : (
    <span className='w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground shrink-0'>
      {TYPE_ICON[n.type]}
    </span>
  );
}

function NotificationThumb({ n }: { n: AppNotification }) {
  const [thumbError, setThumbError] = useState(false);

  if (!n.thumbnailUrl || thumbError) return null;

  return (
    <img
      src={n.thumbnailUrl}
      alt=''
      onError={() => setThumbError(true)}
      className='w-[100px] h-[56px] rounded-lg object-cover bg-secondary shrink-0'
    />
  );
}

import NotificationMenu from '@/components/notification/NotificationMenu';

export default function NotificationBell() {
  const { unreadCount, notifications, markAsRead, markAllAsRead, hideNotification, hideAllFromActor } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const router = useRouter();

  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleOpen = () => setOpen((o) => !o);

  const closePopup = () => {
    setOpen(false);
    setMenuOpenId(null);
  };

  const handleClick = (n: AppNotification) => {
    if (!n.read) markAsRead(n.id);
    if (isVideoType(n.type) && n.relatedId) router.push(`/watch/${n.videoSlug || n.relatedId}`);
    closePopup();
  };

  const handleHide = (n: AppNotification) => hideNotification(n.id);

  const handleMuteChannel = (n: AppNotification) => {
    if (n.actorId) subscriptionApi.muteChannel(n.actorId);
  };

  const handleMuteAll = (n: AppNotification) => {
    if (!n.actorId) return;
    subscriptionApi.muteChannel(n.actorId);
    hideAllFromActor(n.actorId);
  };

  return (
    <div className='relative'>
      <button
        onClick={handleOpen}
        className='p-2 text-foreground hover:text-accent transition-colors relative'
        aria-label='Thông báo'
      >
        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.8}
            d='M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0'
          />
        </svg>
        {unreadCount > 0 && (
          <span className='absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#cc0000] text-white text-[10px] font-bold leading-none'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => closePopup()} />
          <div className='absolute right-0 mt-3 w-[400px] bg-primary border border-secondary rounded-2xl shadow-2xl z-50 overflow-hidden'>
            {/* Header */}
            <div className='flex items-center justify-between px-4 py-3'>
              <h3 className='text-xl font-bold text-foreground'>Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className='text-sm text-accent hover:underline'
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className='flex gap-2 px-4 pb-3'>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  filter === 'all'
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-gray-500 hover:bg-secondary/60'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  filter === 'unread'
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-gray-500 hover:bg-secondary/60'
                }`}
              >
                Chưa đọc
              </button>
            </div>

            {/* Divider */}
            <div className='h-px bg-secondary' />

            {/* List */}
            {visible.length === 0 ? (
              <div className='px-4 py-12 text-center text-sm text-gray-500'>
                Không có thông báo nào
              </div>
            ) : (
              <ul className='max-h-[70vh] overflow-y-auto scrollbar-thin pr-1'>
                {visible.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      n.read ? 'hover:bg-secondary/50' : 'bg-secondary/30 hover:bg-secondary/50'
                    }`}
                  >
                    <NotificationMenu
                      n={n}
                      open={menuOpenId === n.id}
                      onToggle={() => setMenuOpenId(menuOpenId === n.id ? null : n.id)}
                      onClose={() => setMenuOpenId(null)}
                      onHide={handleHide}
                      onMuteChannel={handleMuteChannel}
                      onMuteAll={handleMuteAll}
                    />
                    <NotificationAvatar n={n} />
                    <div className='min-w-0 flex-1'>
                      <p
                        className={`text-sm leading-snug line-clamp-2 ${
                          n.read ? 'text-gray-500' : 'text-foreground font-medium'
                        }`}
                      >
                        {n.content}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                    <NotificationThumb n={n} />
                    {!n.read && (
                      <span className='self-center w-2 h-2 rounded-full bg-[#065fd4] shrink-0' />
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Footer */}
            <button
              onClick={() => {
                closePopup();
                router.push('/profile?tab=notifications');
              }}
              className='w-full text-center px-4 py-3 text-sm text-accent font-medium hover:bg-secondary/40 border-t border-secondary'
            >
              Xem tất cả
            </button>
          </div>
        </>
      )}
    </div>
  );
}
