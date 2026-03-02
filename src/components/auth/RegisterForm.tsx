'use client';

import { useState } from 'react';
import type { RegisterRequest } from '@/types';
import { authApi } from '@/lib/apis';

interface RegisterFormProps {
    onSuccess?: (message: string) => void;
    onSwitchToLogin?: () => void;
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

const INITIAL_FORM: RegisterRequest & { confirmPassword: string; gender: string; agreeTerms: boolean } = {
    username: '',
    fullName: '',
    numberPhone: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    agreeTerms: false,
};

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange =
        (field: keyof typeof INITIAL_FORM) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
                setFormData((prev) => ({ ...prev, [field]: value }));
            };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu không khớp!');
            return;
        }
        if (!formData.agreeTerms) {
            setError('Vui lòng đồng ý với điều khoản và chính sách!');
            return;
        }

        setLoading(true);
        try {
            const registerData: RegisterRequest = {
                username: formData.username || formData.email.split('@')[0],
                password: formData.password,
                email: formData.email,
                fullName: formData.fullName,
                numberPhone: formData.numberPhone,
            };

            const response = await authApi.register(registerData);
            const message = response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.';

            setFormData(INITIAL_FORM);
            onSuccess?.(message);
        } catch (err: any) {
            console.error('Register error:', err);
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

            <input
                type='text'
                placeholder='Tên đầy đủ *'
                value={formData.fullName}
                onChange={handleChange('fullName')}
                className='auth-input'
                required
                disabled={loading}
            />

            <input
                type='tel'
                placeholder='Số điện thoại *'
                value={formData.numberPhone}
                onChange={handleChange('numberPhone')}
                className='auth-input'
                required
                disabled={loading}
            />

            <input
                type='email'
                placeholder='Địa chỉ email *'
                value={formData.email}
                onChange={handleChange('email')}
                className='auth-input'
                required
                disabled={loading}
            />

            <select
                value={formData.gender}
                onChange={handleChange('gender')}
                className='auth-input'
                required
                disabled={loading}
            >
                <option value='' disabled>
                    Giới tính *
                </option>
                <option value='male'>Nam</option>
                <option value='female'>Nữ</option>
                <option value='other'>Khác</option>
            </select>

            {/* Password */}
            <div className='relative'>
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Mật khẩu *'
                    value={formData.password}
                    onChange={handleChange('password')}
                    className='auth-input'
                    required
                    minLength={8}
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

            {/* Confirm Password */}
            <div className='relative'>
                <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Nhập lại mật khẩu *'
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    className='auth-input'
                    required
                    disabled={loading}
                />
                <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-opacity-80 transition-colors'
                >
                    {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
            </div>

            {/* Terms */}
            <div className='flex items-start gap-2'>
                <input
                    type='checkbox'
                    id='agreeTerms'
                    checked={formData.agreeTerms}
                    onChange={handleChange('agreeTerms')}
                    className='mt-1 w-4 h-4 accent-accent cursor-pointer'
                    required
                    disabled={loading}
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

            <button
                type='submit'
                disabled={loading}
                className='w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>

            <p className='text-center text-sm text-gray-600 dark:text-gray-400'>
                Đã có tài khoản?{' '}
                <button type='button' onClick={onSwitchToLogin} className='text-accent hover:underline'>
                    Đăng nhập
                </button>
            </p>
        </form>
    );
}
