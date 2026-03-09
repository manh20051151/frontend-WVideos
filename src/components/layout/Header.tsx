'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import AuthModal from '@/components/auth/AuthModal';
import UserDropdown from './UserDropdown';
import NavLinks from './NavLinks';

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
                  📤 Tải lên
                </Link>
                <Link href='/nap-tien' className='btn'>
                  💰 Nạp tiền
                </Link>
                {user.roles?.some(role => role.name === 'ADMIN') && (
                  <Link href='/admin/dashboard' className='btn btn-accent'>
                    🔧 Admin
                  </Link>
                )}
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
                <Link href='/login' className='btn btn-accent'>
                  🔐 Admin
                </Link>
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
