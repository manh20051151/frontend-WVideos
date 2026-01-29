'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className='bg-white shadow-md'>
      <nav className='container mx-auto px-4 py-4 flex justify-between items-center'>
        <Link href='/' className='text-2xl font-bold text-blue-600'>
          WVideos
        </Link>

        <div className='flex items-center gap-6'>
          <Link href='/' className='hover:text-blue-600'>
            Trang chủ
          </Link>
          {user ? (
            <>
              <Link href='/upload' className='hover:text-blue-600'>
                Tải lên
              </Link>
              <Link href='/profile' className='hover:text-blue-600'>
                Hồ sơ
              </Link>
              {user.role === 'ADMIN' && (
                <Link href='/admin' className='hover:text-blue-600'>
                  Quản trị
                </Link>
              )}
              <button
                onClick={logout}
                className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                href='/login'
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
              >
                Đăng nhập
              </Link>
              <Link
                href='/register'
                className='px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50'
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
