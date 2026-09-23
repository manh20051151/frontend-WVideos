'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import notificationApi from '@/lib/apis/notification.api';
import { userApi } from '@/lib/apis/user.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientOnly from '@/components/common/ClientOnly';

type TargetMode = 'ALL' | 'SPECIFIC';

interface SearchUser {
  id: string;
  fullName?: string;
  email: string;
  avatar?: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [targetMode, setTargetMode] = useState<TargetMode>('ALL');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Trạng thái tìm kiếm người nhận
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const isAdmin = !!user?.roles?.some((r) => r.name === 'ADMIN');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  // Tìm kiếm người dùng (debounce 300ms)
  useEffect(() => {
    if (!searchText.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const page = await userApi.search(searchText.trim(), 0, 8);
        setResults((page.content as SearchUser[]) ?? []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAdmin) {
    return (
      <ClientOnly fallback={
        <>
          <Header />
          <div className='min-h-screen bg-primary flex items-center justify-center'>
            <div className='animate-pulse text-center'>
              <div className='w-16 h-16 bg-secondary rounded-full mx-auto mb-4'></div>
            </div>
          </div>
          <Footer />
        </>
      }>
        {null}
      </ClientOnly>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Tiêu đề không được để trống');
      return;
    }
    if (!content.trim()) {
      setError('Nội dung không được để trống');
      return;
    }
    if (targetMode === 'SPECIFIC' && !selectedUser) {
      setError('Vui lòng chọn người nhận từ kết quả tìm kiếm');
      return;
    }

    setSending(true);
    try {
      const sentCount = await notificationApi.sendAdminNotification({
        ...(targetMode === 'SPECIFIC' && selectedUser ? { recipientId: selectedUser.id } : {}),
        title: title.trim(),
        content: content.trim(),
      });
      setSuccess(`Đã gửi thông báo thành công đến ${sentCount} người dùng`);
      setTitle('');
      setContent('');
      setSelectedUser(null);
      setSearchText('');
      setTargetMode('ALL');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gửi thông báo thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='mb-6'>
            <button
              onClick={() => router.push('/admin')}
              className='text-sm text-foreground opacity-60 hover:opacity-100 transition-opacity mb-3 inline-flex items-center gap-1'
            >
              ← Quay lại Dashboard
            </button>
            <h1 className='text-3xl font-bold text-foreground'>📢 Gửi thông báo</h1>
            <p className='mt-2 text-foreground opacity-70'>
              Gửi thông báo từ quản trị viên đến người dùng.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className='bg-secondary rounded-xl p-6 border border-accent space-y-5'
          >
            {/* Chọn đối tượng nhận */}
            <div>
              <label className='block text-sm font-medium mb-2 text-foreground'>Đối tượng nhận</label>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setTargetMode('ALL')}
                  className={`flex-1 px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
                    targetMode === 'ALL'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-primary text-foreground border-accent hover:bg-accent/10'
                  }`}
                >
                  Tất cả người dùng
                </button>
                <button
                  type='button'
                  onClick={() => setTargetMode('SPECIFIC')}
                  className={`flex-1 px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
                    targetMode === 'SPECIFIC'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-primary text-foreground border-accent hover:bg-accent/10'
                  }`}
                >
                  Một người dùng
                </button>
              </div>
            </div>

            {targetMode === 'SPECIFIC' && (
              <div ref={searchRef} className='relative'>
                <label className='block text-sm font-medium mb-2 text-foreground'>Tìm kiếm người nhận</label>

                {selectedUser ? (
                  <div className='flex items-center gap-3 p-3 bg-primary rounded-lg border border-accent'>
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt='' className='w-10 h-10 rounded-full object-cover' />
                    ) : (
                      <div className='w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold'>
                        {(selectedUser.fullName || selectedUser.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-foreground truncate'>
                        {selectedUser.fullName || selectedUser.email}
                      </p>
                      <p className='text-xs text-foreground opacity-60 truncate'>{selectedUser.email}</p>
                    </div>
                    <button
                      type='button'
                      onClick={() => setSelectedUser(null)}
                      className='text-foreground opacity-60 hover:opacity-100 p-1'
                      aria-label='Bỏ chọn'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className='relative'>
                      <input
                        type='text'
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onFocus={() => results.length > 0 && setShowDropdown(true)}
                        placeholder='Nhập tên hoặc email người dùng...'
                        className='w-full px-4 py-2.5 pr-10 rounded-lg border border-accent bg-primary text-foreground'
                      />
                      {searching && (
                        <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                          <div className='animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent'></div>
                        </div>
                      )}
                    </div>

                    {showDropdown && results.length > 0 && (
                      <ul className='absolute z-10 mt-1 w-full bg-primary border border-accent rounded-lg shadow-2xl max-h-64 overflow-y-auto'>
                        {results.map((u) => (
                          <li key={u.id}>
                            <button
                              type='button'
                              onClick={() => {
                                setSelectedUser(u);
                                setSearchText('');
                                setShowDropdown(false);
                              }}
                              className='w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/60 transition-colors'
                            >
                              {u.avatar ? (
                                <img src={u.avatar} alt='' className='w-8 h-8 rounded-full object-cover shrink-0' />
                              ) : (
                                <div className='w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold shrink-0'>
                                  {(u.fullName || u.email).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className='min-w-0'>
                                <p className='text-sm font-medium text-foreground truncate'>{u.fullName || u.email}</p>
                                <p className='text-xs text-foreground opacity-60 truncate'>{u.email}</p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {showDropdown && !searching && searchText.trim() && results.length === 0 && (
                      <p className='mt-2 text-sm text-foreground opacity-60'>Không tìm thấy người dùng.</p>
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <label className='block text-sm font-medium mb-2 text-foreground'>Tiêu đề</label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Thông báo bảo trì hệ thống'
                className='w-full px-4 py-2.5 rounded-lg border border-accent bg-primary text-foreground'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2 text-foreground'>Nội dung</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder='Nhập nội dung thông báo...'
                className='w-full px-4 py-2.5 rounded-lg border border-accent bg-primary text-foreground resize-none'
              />
            </div>

            {error && (
              <div className='p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm'>{error}</div>
            )}
            {success && (
              <div className='p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm'>{success}</div>
            )}

            <button
              type='submit'
              disabled={sending}
              className='w-full btn-accent font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {sending ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
