'use client';

import Link from 'next/link';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
  title?: string;
  message?: string;
}

/**
 * Popup thông báo yêu cầu đăng nhập. Component tái sử dụng cho mọi thao tác
 * cần xác thực (thích, không thích, đăng ký kênh, bình luận...).
 */
export default function LoginRequiredModal({
  isOpen,
  onClose,
  onLogin,
  title = 'Yêu cầu đăng nhập',
  message = 'Vui lòng đăng nhập để thực hiện thao tác này.',
}: LoginRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-md overflow-hidden rounded-2xl bg-secondary shadow-2xl shadow-black/30'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh đầu card màu accent */}
        <div className='h-1.5 w-full bg-accent' />

        <div className='p-8 text-center'>
          {/* Icon khóa trong vòng tròn accent */}
          <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent'>
            <svg
              className='h-10 w-10 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <rect x='3' y='11' width='18' height='11' rx='2' strokeLinejoin='round' strokeWidth={2} />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
            </svg>
          </div>

          <h2 className='mb-2 text-2xl font-bold text-foreground'>{title}</h2>
          <p className='mx-auto mb-8 max-w-sm text-foreground/70'>{message}</p>

          <div className='flex flex-col gap-3'>
            {onLogin && (
              <button
                onClick={() => {
                  onClose();
                  onLogin();
                }}
                className='w-full cursor-pointer rounded-xl bg-accent py-3 font-semibold text-white transition-colors hover:bg-accent/90 active:bg-accent/80'
              >
                Đăng nhập / Đăng ký
              </button>
            )}

            <div className='flex gap-3'>
              <Link
                href='/'
                onClick={onClose}
                className='flex-1 cursor-pointer rounded-xl bg-primary py-3 font-medium text-foreground transition-colors hover:opacity-80'
              >
                Về trang chủ
              </Link>
              <button
                onClick={onClose}
                className='flex-1 cursor-pointer rounded-xl border border-accent py-3 font-medium text-foreground transition-colors hover:bg-accent/10'
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
