'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import AuthModal from '@/components/auth/AuthModal';

export default function Header() {
  const { user, logout, mounted } = useAuth();
  const { isDark, toggleDarkMode, mounted: darkModeReady } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search:', searchQuery);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className='bg-primary border-b border-secondary'>
        <div className='container mx-auto px-4'>
          {/* Top bar */}
          <div className='flex items-center justify-between py-3'>
            <Link href='/' className='flex items-center gap-2'>
              <span className='text-accent text-2xl font-bold'>w</span>
              <span className='text-highlight text-2xl font-bold'>video</span>
            </Link>
            <div className='flex-1 max-w-2xl mx-8'>
              <div className='h-10 bg-secondary rounded' />
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-24 h-10 bg-secondary rounded' />
              <div className='w-24 h-10 bg-secondary rounded' />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className='bg-primary border-b border-secondary'>
      <div className='container mx-auto px-4'>
        {/* Top bar */}
        <div className='flex items-center justify-between py-3'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2'>
            <span className='text-accent text-2xl font-bold'>wd</span>
            <span className='text-foreground text-2xl font-bold'>video</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className='flex-1 max-w-2xl mx-8'>
            <div className='relative'>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Tìm kiếm...'
                className='w-full px-4 py-2 bg-secondary text-foreground placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-accent'
              />
              <button
                type='submit'
                className='absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 rounded hover:bg-opacity-90'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Auth buttons */}
          <div className='flex items-center gap-4'>
            {/* Dark mode toggle */}
            {darkModeReady && (
              <button
                onClick={toggleDarkMode}
                className='p-2 text-foreground hover:text-accent transition-colors'
                aria-label='Toggle dark mode'
              >
                {isDark ? (
                  // Sun icon for light mode
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                    />
                  </svg>
                ) : (
                  // Moon icon for dark mode
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                    />
                  </svg>
                )}
              </button>
            )}

            {user ? (
              <>
                <Link href='/upload' className='btn'>
                  📤 Tải lên
                </Link>
                <Link href='/nap-tien' className='btn'>
                  💰 Nạp tiền
                </Link>
                
                {/* User dropdown */}
                <div className='relative' ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='p-1 rounded-full hover:ring-2 hover:ring-accent transition-all'
                  >
                    <img
                      src={user.avatar || 'https://res.cloudinary.com/dnvtmbmne/image/upload/v1744707484/et5vc9r9fejjgrjsvxyn.jpg'}
                      alt={user.fullName || user.username}
                      className='w-10 h-10 rounded-full object-cover border-2 border-accent'
                    />
                  </button>

                  {/* Dropdown menu */}
                  {isUserMenuOpen && (
                    <div className='absolute right-0 mt-2 w-56 bg-primary border-2 border-accent rounded-lg shadow-xl py-2 z-50'>
                      <div className='px-4 py-3 border-b border-accent'>
                        <p className='text-sm font-medium text-foreground'>{user.fullName || user.username}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>{user.email}</p>
                      </div>
                      
                      <Link
                        href='/profile'
                        className='flex items-center gap-2 px-4 py-2 text-foreground hover:bg-secondary transition-colors'
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                        Trang cá nhân
                      </Link>
                      
                      <Link
                        href='/my-videos'
                        className='flex items-center gap-2 px-4 py-2 text-foreground hover:bg-secondary transition-colors'
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
                        </svg>
                        Video của tôi
                      </Link>
                      
                      <Link
                        href='/wallet'
                        className='flex items-center gap-2 px-4 py-2 text-foreground hover:bg-secondary transition-colors'
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' />
                        </svg>
                        Ví của tôi
                      </Link>
                      
                      <Link
                        href='/settings'
                        className='flex items-center gap-2 px-4 py-2 text-foreground hover:bg-secondary transition-colors'
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                        Cài đặt
                      </Link>
                      
                      <hr className='my-2 border-accent' />
                      
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className='flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:bg-secondary transition-colors'
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href='/upload' className='btn'>
                  📤 Tải lên
                </Link>
                <Link href='/nap-tien' className='btn'>
                  💰 Nạp tiền
                </Link>
                <button
                  onClick={() => {
                    setAuthModalTab('register');
                    setIsAuthModalOpen(true);
                  }}
                  className='btn'
                >
                  Đăng ký
                </button>
                <button
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                  className='btn'
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='lg:hidden ml-4 text-foreground'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16M4 18h16'
              />
            </svg>
          </button>
        </div>

        {/* Navigation menu */}
        <nav className='hidden lg:flex items-center justify-around gap-6 py-2 text-sm border-t border-secondary h-12'>
          <Link
            href='/'
            className='text-foreground hover:text-accent transition-colors flex items-center gap-1'
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' />
            </svg>
          </Link>
          <Link
            href='/cap-sao-moi-nhat'
            className='text-foreground hover:text-accent transition-colors'
          >
            Cập Sao Mới Nhất 🔥
          </Link>
          <Link
            href='/clip-sao-tao-noi-dung'
            className='text-foreground hover:text-accent transition-colors'
          >
            Clip Sao Tạo Nội Dung 🎬
          </Link>
          <Link
            href='/clip-sao-hat-nhep'
            className='text-foreground hover:text-accent transition-colors'
          >
            Clip Sao Hát Nhép 🎤
          </Link>
          <Link
            href='/anh-sao'
            className='text-foreground hover:text-accent transition-colors'
          >
            Ảnh Sao 📷
          </Link>
          <Link
            href='/the-loai'
            className='text-foreground hover:text-accent transition-colors'
          >
            Thể Loại ▼
          </Link>
          <Link
            href='/khac'
            className='text-foreground hover:text-accent transition-colors'
          >
            Khác 📋
          </Link>
          <Link
            href='/dong-gop'
            className='text-foreground hover:text-accent transition-colors'
          >
            Đóng Góp 💰
          </Link>
          <Link
            href='/thong-bao'
            className='text-foreground hover:text-accent transition-colors'
          >
            Thông báo 🔔
          </Link>

        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className='lg:hidden py-4 border-t border-secondary'>
            <div className='flex flex-col gap-3'>
              <Link
                href='/'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href='/cap-sao-moi-nhat'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cập Sao Mới Nhất 🔥
              </Link>
              <Link
                href='/clip-sao-tao-noi-dung'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Clip Sao Tạo Nội Dung 🎬
              </Link>
              <Link
                href='/clip-sao-hat-nhep'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Clip Sao Hát Nhép 🎤
              </Link>
              <Link
                href='/anh-sao'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ảnh Sao 📷
              </Link>
              <Link
                href='/the-loai'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Thể Loại
              </Link>
              <Link
                href='/khac'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Khác 📋
              </Link>
              <Link
                href='/dong-gop'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Đóng Góp 💰
              </Link>
              <Link
                href='/thong-bao'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Thông báo 🔔
              </Link>
              <Link
                href='/dang-clip'
                className='text-foreground hover:text-accent transition-colors py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Đăng Clip / Hình Ảnh 📤
              </Link>
            </div>
          </nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
}
