'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function OAuth2RedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      if (error === 'user_locked') {
        setMessage('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      } else {
        setMessage('Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Không nhận được token xác thực.');
      return;
    }

    // Lưu token và lấy thông tin user
    const handleOAuth2Login = async () => {
      try {
        // Lưu token vào localStorage
        localStorage.setItem('token', token);
        
        // Gọi API để lấy thông tin user
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/users/myInfo`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Không thể lấy thông tin người dùng');
        }

        const data = await response.json();
        const userInfo = data.result || data;
        
        // Lưu thông tin user vào localStorage
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        setStatus('success');
        setMessage('Đăng nhập Google thành công!');

        // Redirect về trang chủ sau 1 giây
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setStatus('error');
        setMessage('Đăng nhập thành công nhưng không thể lấy thông tin người dùng. Vui lòng thử đăng nhập lại.');
        localStorage.removeItem('token');
      }
    };

    handleOAuth2Login();
  }, [searchParams, router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-primary px-4'>
      <div className='max-w-md w-full bg-secondary rounded-lg shadow-xl p-8'>
        {status === 'loading' && (
          <div className='text-center'>
            <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4'></div>
            <h2 className='text-2xl font-bold text-foreground mb-2'>Đang xử lý...</h2>
            <p className='text-gray-600 dark:text-gray-400'>Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {status === 'success' && (
          <div className='text-center'>
            <div className='w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-foreground mb-2'>Thành công!</h2>
            <p className='text-gray-600 dark:text-gray-400 mb-4'>{message}</p>
            <p className='text-sm text-gray-500 dark:text-gray-500'>Đang chuyển hướng về trang chủ...</p>
          </div>
        )}

        {status === 'error' && (
          <div className='text-center'>
            <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-red-600 dark:text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-foreground mb-2'>Lỗi đăng nhập</h2>
            <p className='text-gray-600 dark:text-gray-400 mb-6'>{message}</p>
            <button
              onClick={() => router.push('/')}
              className='px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors'
            >
              Về trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OAuth2RedirectPage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen flex items-center justify-center bg-primary px-4'>
        <div className='max-w-md w-full bg-secondary rounded-lg shadow-xl p-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4'></div>
            <h2 className='text-2xl font-bold text-foreground mb-2'>Đang tải...</h2>
          </div>
        </div>
      </div>
    }>
      <OAuth2RedirectContent />
    </Suspense>
  );
}
