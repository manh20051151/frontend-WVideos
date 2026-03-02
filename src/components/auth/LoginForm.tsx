'use client';

import { useState } from 'react';
import type { LoginRequest } from '@/types';
import { authApi } from '@/lib/apis';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToRegister?: () => void;
}

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

const GoogleIcon = () => (
    <svg className='w-5 h-5' viewBox='0 0 24 24'>
        <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
        <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
        <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
        <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
    </svg>
);

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
    const [formData, setFormData] = useState<LoginRequest>({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/oauth2/authorization/google`;
    };

    const handleChange = (field: keyof LoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await authApi.login(formData);

            if (response.result?.token) {
                localStorage.setItem('token', response.result.token);

                const userInfo = await authApi.getMyInfo();
                if (userInfo.result) {
                    localStorage.setItem('user', JSON.stringify(userInfo.result));
                }

                setSuccess('Đăng nhập thành công!');
                setTimeout(() => onSuccess?.(), 500);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
                <div className='p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm'>
                    {error}
                </div>
            )}
            {success && (
                <div className='p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg text-sm'>
                    {success}
                </div>
            )}

            {/* Google login */}
            <button
                type='button'
                onClick={handleGoogleLogin}
                className='w-full py-3 px-4 border border-accent rounded-lg flex items-center justify-center gap-2 text-accent bg-white dark:bg-secondary hover:bg-gray-200 dark:hover:bg-gray-1000 transition-colors'
            >
                <GoogleIcon />
                Đăng nhập với Google
            </button>

            <div className='flex items-center gap-4'>
                <div className='flex-1 h-px bg-gray-300 dark:bg-gray-600' />
                <span className='text-gray-500 dark:text-gray-400 text-sm'>HOẶC</span>
                <div className='flex-1 h-px bg-gray-300 dark:bg-gray-600' />
            </div>

            {/* Email */}
            <input
                type='email'
                placeholder='Địa chỉ email *'
                value={formData.email}
                onChange={handleChange('email')}
                className='auth-input'
                required
                disabled={loading}
            />

            {/* Password */}
            <div className='relative'>
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Mật khẩu *'
                    value={formData.password}
                    onChange={handleChange('password')}
                    className='auth-input'
                    required
                    disabled={loading}
                />
                <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-opacity-80 transition-colors'
                >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
            </div>

            <div className='text-right'>
                <a href='#' className='text-accent text-sm hover:underline'>
                    Quên mật khẩu?
                </a>
            </div>

            <button
                type='submit'
                disabled={loading}
                className='w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>

            <p className='text-center text-sm text-gray-600 dark:text-gray-400'>
                Chưa có tài khoản?{' '}
                <button type='button' onClick={onSwitchToRegister} className='text-accent hover:underline'>
                    Đăng ký
                </button>
            </p>
        </form>
    );
}
