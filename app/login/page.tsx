'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      await login(formData.email, formData.password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <div>
            <h2 className='mt-6 text-center text-3xl font-extrabold text-foreground'>
              🔐 Đăng nhập Admin
            </h2>
            <p className='mt-2 text-center text-sm text-foreground opacity-70'>
              Đăng nhập để quản lý hệ thống
            </p>
          </div>
          
          <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <p className='text-red-600 text-sm'>{error}</p>
              </div>
            )}
            
            <div className='space-y-4'>
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-foreground mb-2'>
                  Email
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className='auth-input'
                  placeholder='admin@example.com'
                />
              </div>
              
              <div>
                <label htmlFor='password' className='block text-sm font-medium text-foreground mb-2'>
                  Mật khẩu
                </label>
                <input
                  id='password'
                  name='password'
                  type='password'
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className='auth-input'
                  placeholder='••••••••'
                />
              </div>
            </div>

            <div>
              <button
                type='submit'
                disabled={loading}
                className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}