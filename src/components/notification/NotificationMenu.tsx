'use client';

import type { AppNotification } from '@/lib/hooks/useNotifications';

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

const KebabIcon = () => (
  <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
    <circle cx='12' cy='5' r='1.8' />
    <circle cx='12' cy='12' r='1.8' />
    <circle cx='12' cy='19' r='1.8' />
  </svg>
);

const EyeOffIcon = () => (
  <svg {...svgProps} className='w-[18px] h-[18px] shrink-0'>
    <path d='M9.88 9.88a3 3 0 1 0 4.24 4.24' />
    <path d='M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' />
    <path d='M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' />
    <path d='M2 2l20 20' />
  </svg>
);

const BellOffIcon = () => (
  <svg {...svgProps} className='w-[18px] h-[18px] shrink-0'>
    <path d='M8.7 3A6 6 0 0 1 18 8c0 7 3 9 3 9H6s-2-1.5-2-3' />
    <path d='M13.73 21a2 2 0 0 1-3.46 0' />
    <path d='M2 2l20 20' />
  </svg>
);

type MenuAction = (n: AppNotification) => void;

export default function NotificationMenu({
  n,
  open,
  onToggle,
  onClose,
  onHide,
  onMuteChannel,
  onMuteAll,
}: {
  n: AppNotification;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onHide: MenuAction;
  onMuteChannel: MenuAction;
  onMuteAll: MenuAction;
}) {
  const isChannel = n.type === 'NEW_VIDEO' && !!n.actorId;

  return (
    <div className='relative shrink-0' onClick={(e) => e.stopPropagation()}>
      <button
        type='button'
        onClick={onToggle}
        className='p-1.5 rounded-full text-gray-400 hover:text-foreground hover:bg-secondary/70 transition-colors'
        aria-label='Tùy chọn thông báo'
        aria-haspopup='menu'
        aria-expanded={open}
      >
        <KebabIcon />
      </button>

      {open && (
        <>
          <div className='fixed inset-0 z-[55]' onClick={onClose} />
          <div
            role='menu'
            className='absolute left-0 top-full mt-1 w-72 bg-primary border border-secondary rounded-xl shadow-2xl z-[60] py-1'
          >
            <button
              type='button'
              role='menuitem'
              onClick={() => {
                onHide(n);
                onClose();
              }}
              className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 text-left transition-colors'
            >
              <EyeOffIcon />
              <span>Ẩn thông báo này</span>
            </button>

            {isChannel && (
              <>
                <button
                  type='button'
                  role='menuitem'
                  onClick={() => {
                    onMuteChannel(n);
                    onClose();
                  }}
                  className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 text-left transition-colors'
                >
                  <BellOffIcon />
                  <span>
                    Tắt bớt thông báo của kênh{' '}
                    <span className='font-medium'>{n.actorName}</span>
                  </span>
                </button>
                <button
                  type='button'
                  role='menuitem'
                  onClick={() => {
                    onMuteAll(n);
                    onClose();
                  }}
                  className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 text-left transition-colors'
                >
                  <BellOffIcon />
                  <span>
                    Tắt tất cả thông báo từ{' '}
                    <span className='font-medium'>{n.actorName}</span>
                  </span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
