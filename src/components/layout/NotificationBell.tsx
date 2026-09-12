'use client';

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';

export default function NotificationBell() {
  const { unreadCount, notifications } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className='relative'>
      <button
        onClick={() => setOpen(!open)}
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
          <span className='absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setOpen(false)} />
          <div className='absolute right-0 mt-2 w-72 bg-primary border border-secondary rounded-md shadow-lg z-50'>
            <div className='px-4 py-2 border-b border-secondary font-semibold text-foreground'>
              Thông báo
            </div>
            {notifications.length === 0 ? (
              <div className='px-4 py-6 text-center text-sm text-gray-400'>
                Chưa có thông báo
              </div>
            ) : (
              <ul className='max-h-80 overflow-y-auto'>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className='px-4 py-3 border-b border-secondary last:border-0 text-sm text-foreground'
                  >
                    <div className='font-medium'>{n.title}</div>
                    <div className='text-gray-400 text-xs mt-1'>{n.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
