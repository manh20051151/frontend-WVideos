'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/apis/auth.api';

const EyeIcon = () => (
  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
  </svg>
);

const EyeOffIcon = () => (
  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
  </svg>
);

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'form' | 'submitting' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại từ trang đăng nhập.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (password.length < 8) {
      setMessage('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Mật khẩu nhập lại không khớp');
      return;
    }

    setStatus('submitting');
    try {
      const response = await authApi.resetPassword(token!, password);
      setStatus('success');
      setMessage(response.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      setStatus('error');
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn hoặc đã được sử dụng.');
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-primary px-4'>
      <div className='max-w-md w-full bg-secondary rounded-lg shadow-xl p-8'>
        {(status === 'form' || status === 'submitting') && token && (
          <>
            <div className='text-center mb-6'>
              <div className='w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
              </div>
              <h2 className='text-2xl font-bold text-foreground mb-2'>Đặt lại mật khẩu</h2>
              <p className='text-sm text-gray-600 dark:text-gray-400'>Nhập mật khẩu mới cho tài khoản của bạn</p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Mật khẩu mới (tối thiểu 8 ký tự) *'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='auth-input pr-10'
                  required
                  minLength={8}
                  disabled={status === 'submitting'}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-opacity-80 transition-colors'
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>

              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Nhập lại mật khẩu mới *'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='auth-input pr-10'
                  required
                  minLength={8}
                  disabled={status === 'submitting'}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-opacity-80 transition-colors'
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>

              {message && <p className='text-sm text-red-500'>{message}</p>}

              <button
                type='submit'
                disabled={status === 'submitting'}
                className='w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {status === 'submitting' ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
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
            <p className='text-sm text-gray-500 dark:text-gray-500'>Đang chuyển về trang chủ... Bạn có thể đăng nhập với mật khẩu mới.</p>
          </div>
        )}

        {status === 'error' && (
          <div className='text-center'>
            <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-red-600 dark:text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-foreground mb-2'>Không thể đặt lại mật khẩu</h2>
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

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
