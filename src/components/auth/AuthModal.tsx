'use client';

import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement authentication logic
    console.log('Form submitted:', formData);
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google login
    console.log('Google login');
  };

  const inputClassName = 'w-full px-4 py-3 border border-accent rounded-lg bg-white dark:bg-secondary text-gray-900 dark:text-highlight placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm' onClick={onClose}>
      <div className='bg-white dark:bg-primary rounded-lg shadow-xl w-full max-w-md mx-4 relative' onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
        >
          <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>

        {/* Tabs */}
        <div className='flex border-b border-gray-200 dark:border-gray-700'>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Đăng ký
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Đăng nhập
          </button>
        </div>

        {/* Form content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {activeTab === 'login' ? (
              <>
                {/* Google login button */}
                <button
                  type='button'
                  onClick={handleGoogleLogin}
                  className='w-full py-3 px-4 border border-accent rounded-lg flex items-center justify-center gap-2 text-accent bg-white dark:bg-secondary hover:bg-gray-200 dark:hover:bg-gray-1000 transition-colors'
                >
                  <svg className='w-5 h-5' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  Đăng nhập với Google
                </button>

                {/* Divider */}
                <div className='flex items-center gap-4'>
                  <div className='flex-1 h-px bg-gray-300 dark:bg-gray-600'></div>
                  <span className='text-gray-500 dark:text-gray-400 text-sm'>HOẶC</span>
                  <div className='flex-1 h-px bg-gray-300 dark:bg-gray-600'></div>
                </div>

                {/* Email input */}
                <div>
                  <input
                    type='email'
                    placeholder='Địa chỉ email *'
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClassName}
                    required
                  />
                </div>

                {/* Password input */}
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Mật khẩu *'
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputClassName}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-opacity-80 transition-colors'
                  >
                    {showPassword ? (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Forgot password */}
                <div className='text-right'>
                  <a href='#' className='text-accent text-sm hover:underline'>
                    Quên mật khẩu?
                  </a>
                </div>

                {/* Submit button */}
                <button
                  type='submit'
                  className='w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors'
                >
                  Đăng nhập
                </button>

                {/* Switch to register */}
                <p className='text-center text-sm text-gray-600 dark:text-gray-400'>
                  Chưa có tài khoản?{' '}
                  <button
                    type='button'
                    onClick={() => setActiveTab('register')}
                    className='text-accent hover:underline'
                  >
                    Đăng ký
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* Register form */}
                <div>
                  <input
                    type='text'
                    placeholder='Tên đầy đủ *'
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <input
                    type='tel'
                    placeholder='Số điện thoại *'
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <input
                    type='email'
                    placeholder='Địa chỉ email *'
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClassName}
                    required
                  />
                </div>

                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Mật khẩu *'
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputClassName}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-opacity-80 transition-colors'
                  >
                    {showPassword ? (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                      </svg>
                    )}
                  </button>
                </div>

                <div className='relative'>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Nhập lại mật khẩu *'
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={inputClassName}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-opacity-80 transition-colors'
                  >
                    {showConfirmPassword ? (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Terms checkbox */}
                <div className='flex items-start gap-2'>
                  <input
                    type='checkbox'
                    id='agreeTerms'
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className='mt-1 w-4 h-4 accent-accent cursor-pointer'
                    required
                  />
                  <label htmlFor='agreeTerms' className='text-sm text-gray-600 dark:text-gray-400 cursor-pointer'>
                    Tôi đồng ý với{' '}
                    <a href='#' className='text-accent hover:underline'>
                      Điều khoản
                    </a>{' '}
                    và{' '}
                    <a href='#' className='text-accent hover:underline'>
                      Chính sách bảo mật thông tin
                    </a>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type='submit'
                  className='w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors'
                >
                  Đăng ký
                </button>

                {/* Switch to login */}
                <p className='text-center text-sm text-gray-600 dark:text-gray-400'>
                  Đã có tài khoản?{' '}
                  <button
                    type='button'
                    onClick={() => setActiveTab('login')}
                    className='text-accent hover:underline'
                  >
                    Đăng nhập
                  </button>
                </p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
