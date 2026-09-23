'use client';

import { useEffect, useRef, useState } from 'react';
import { subscriptionApi } from '@/lib/apis/subscription.api';

export type NotificationPreference = 'ALL' | 'NONE';

interface ChannelNotificationBellProps {
  channelId: string;
  channelName: string;
  isSubscribed: boolean;
  initialMuted?: boolean;
  className?: string;
  onPreferenceChange?: (preference: NotificationPreference, muted: boolean) => void;
}

const PREFERENCE_LABEL: Record<NotificationPreference, string> = {
  ALL: 'Tất cả',
  NONE: 'Tắt thông báo',
};

const PREFERENCE_DESC: Record<NotificationPreference, string> = {
  ALL: 'Nhận thông báo về mọi video mới',
  NONE: 'Không nhận bất kỳ thông báo nào từ kênh này',
};

// Chuông đầy đủ + sóng âm (Tất cả)
function BellAllIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
      <path d='M13.73 21a2 2 0 0 1-3.46 0' />
      <path d='M8 4a5 5 0 0 0-5 5' opacity={0.5} />
      <path d='M16 4a5 5 0 0 1 5 5' opacity={0.5} />
    </svg>
  );
}

// Chuông bị gạch chéo (Tắt thông báo)
function BellMutedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
      <path d='M13.73 21a2 2 0 0 1-3.46 0' />
      <line x1='3' y1='3' x2='21' y2='21' />
    </svg>
  );
}

function BellIcon({ preference, className }: { preference: NotificationPreference; className?: string }) {
  if (preference === 'NONE') return <BellMutedIcon className={className} />;
  return <BellAllIcon className={className} />;
}

export default function ChannelNotificationBell({
  channelId,
  channelName,
  isSubscribed,
  initialMuted = false,
  className = '',
  onPreferenceChange,
}: ChannelNotificationBellProps) {
  const [preference, setPreference] = useState<NotificationPreference>(
    initialMuted ? 'NONE' : 'ALL'
  );
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  // Chỉ hiển thị khi đã đăng ký kênh
  if (!isSubscribed) return null;

  const applyPreference = async (next: NotificationPreference) => {
    const muted = next === 'NONE';
    // ALL và PERSONALIZED đều tương ứng trạng thái "bật thông báo" (backend hiện chỉ hỗ trợ tắt/mở)
    setPreference(next);
    setOpen(false);
    onPreferenceChange?.(next, muted);

    if (preference === next) return;
    try {
      setUpdating(true);
      if (muted) {
        await subscriptionApi.muteChannel(channelId);
      } else {
        await subscriptionApi.unmuteChannel(channelId);
      }
    } catch (err) {
      // Rollback nếu gọi API thất bại
      setPreference(preference);
      onPreferenceChange?.(preference, preference === 'NONE');
    } finally {
      setUpdating(false);
    }
  };

  const ariaLabel = `Tùy chọn cài đặt hiện tại là ${PREFERENCE_LABEL[preference].toLowerCase()}. Nhấn để thay đổi tùy chọn cài đặt thông báo cho kênh ${channelName}`;

    const options: NotificationPreference[] = ['ALL', 'NONE'];

  return (
    <div className={`relative inline-flex ${className}`} ref={containerRef}>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        disabled={updating}
        aria-label={ariaLabel}
        aria-haspopup='menu'
        aria-expanded={open}
        title={PREFERENCE_LABEL[preference]}
        className='p-2 text-foreground hover:bg-secondary rounded-full transition-colors disabled:opacity-50'
      >
        <BellIcon preference={preference} className='w-6 h-6' />
      </button>

      {open && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setOpen(false)} />
          <div
            role='menu'
            className='absolute right-0 mt-2 w-72 bg-primary border border-secondary rounded-2xl shadow-2xl z-50 overflow-hidden py-1'
          >
            <div className='px-4 py-2.5 border-b border-secondary'>
              <p className='text-xs text-foreground opacity-60'>Thông báo cho</p>
              <p className='text-sm font-semibold text-foreground truncate'>{channelName}</p>
            </div>

            {options.map((opt) => {
              const active = preference === opt;
              return (
                <button
                  key={opt}
                  role='menuitemradio'
                  aria-checked={active}
                  onClick={() => applyPreference(opt)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60 ${
                    active ? 'bg-secondary/40' : ''
                  }`}
                >
                  <span className='mt-0.5 text-foreground shrink-0'>
                    <BellIcon preference={opt} className='w-5 h-5' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-center gap-2'>
                      <span className='text-sm font-medium text-foreground'>{PREFERENCE_LABEL[opt]}</span>
                      {active && (
                        <svg className='w-4 h-4 text-accent' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.4} strokeLinecap='round' strokeLinejoin='round'>
                          <path d='M20 6 9 17l-5-5' />
                        </svg>
                      )}
                    </span>
                    <span className='block text-xs text-foreground opacity-60 mt-0.5'>{PREFERENCE_DESC[opt]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
