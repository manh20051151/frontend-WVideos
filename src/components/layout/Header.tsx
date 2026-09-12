'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import AuthModal from '@/components/auth/AuthModal';
import UserDropdown from './UserDropdown';
import NavLinks from './NavLinks';
import NotificationBell from './NotificationBell';

type AuthTab = 'login' | 'register';

export default function Header() {
  const { user, logout, mounted, refreshProfile } = useAuth();
  const { isDark, toggleDarkMode, mounted: darkModeReady } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthTab>('login');

  const openAuthModal = (tab: AuthTab) => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search:', searchQuery);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className='bg-primary border-b border-secondary'>
        <div className='container mx-auto px-4'>
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
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className='flex items-center gap-4'>
            {/* Dark mode toggle */}
            {darkModeReady && (
              <button
                onClick={toggleDarkMode}
                className='p-2 text-foreground hover:text-accent transition-colors'
                aria-label='Toggle dark mode'
              >
                {isDark ? (
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' />
                  </svg>
                ) : (
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' />
                  </svg>
                )}
              </button>
            )}

            {user ? (
              <>
                <Link href='/upload' className='btn'>
                  <svg className='w-5 h-5 inline-block align-middle mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 7.5 7.5 12M12 7.5v13.5' />
                  </svg>
                  Tải lên
                </Link>
                <Link href='/wallet/topup' className='btn'>
                  <svg className='w-5 h-5 inline-block align-middle mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 5.25h16.5c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 0 1 2.625 19.125V6.375c0-.621.504-1.125 1.125-1.125Z' />
                  </svg>
                  Nạp tiền
                </Link>
                {user.roles?.some(role => role.name === 'ADMIN') && (
                  <Link href='/admin/dashboard' className='btn btn-accent'>
                    <svg className='w-5 h-5 inline-block align-middle mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.68 7.68 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' />
                    </svg>
                    Admin
                  </Link>
                )}
                <NotificationBell />
                <UserDropdown
                  user={user}
                  isOpen={isUserMenuOpen}
                  onToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onClose={() => setIsUserMenuOpen(false)}
                  onLogout={logout}
                />
              </>
            ) : (
              <>
                <button onClick={() => openAuthModal('register')} className='btn'>
                  Đăng ký
                </button>
                <button onClick={() => openAuthModal('login')} className='btn'>
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
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
            </svg>
          </button>
        </div>

        {/* Desktop navigation */}
        <NavLinks />

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className='lg:hidden py-4 border-t border-secondary'>
            <NavLinks vertical onLinkClick={() => setIsMobileMenuOpen(false)} />
          </nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onLoginSuccess={refreshProfile}
      />
    </header>
  );
}
