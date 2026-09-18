'use client';

import { useState, useEffect } from 'react';
import { authApi, UserResponse } from '@/lib/apis/auth.api';

export const useAuth = () => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token) {
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const userWithAvatar: UserResponse = {
            ...parsedUser,
            avatar: parsedUser.avatar || (parsedUser as unknown as { picture?: string }).picture || (parsedUser as unknown as { imageUrl?: string }).imageUrl || (parsedUser as unknown as { photoURL?: string }).photoURL || ''
          };
          setUser(userWithAvatar);
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
      }
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [mounted]);

  const fetchProfile = async () => {
    try {
      const userData = await authApi.getMyInfo();
      console.log('🔍 fetchProfile - raw userData received:', userData);
      
      if (userData && userData.id) {
        // Xử lý avatar từ Google - backend có thể trả về picture thay vì avatar
        const processedUser: UserResponse = {
          ...userData,
          avatar: userData.avatar || (userData as unknown as { picture?: string }).picture || (userData as unknown as { imageUrl?: string }).imageUrl || (userData as unknown as { photoURL?: string }).photoURL || ''
        };
        console.log('🔍 fetchProfile - processed user with avatar:', processedUser.avatar);
        
        setUser(processedUser);
        localStorage.setItem('user', JSON.stringify(processedUser));
      }
    } catch (error: unknown) {
      console.error('Failed to fetch profile:', error);
      // Chỉ logout khi lỗi xác thực (401/403). Không xóa token khi gặp lỗi
      // mạng/server tạm thời (timeout, 5xx, backend đang restart) để tránh
      // mất trạng thái đăng nhập âm thầm khi reload -> mất highlight like/dislike.
      // Lỗi 401 đã được axiosClient xử lý riêng (refresh token hoặc logout).
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const authResponse = await authApi.login({ email, password });
      
      if (authResponse?.token) {
        localStorage.setItem('token', authResponse.token);
        
        const userData = await authApi.getMyInfo();
        if (userData && userData.id) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        return authResponse;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/';
    }
  };

  const isAuthenticated = mounted && !!user && !!localStorage.getItem('token');

  const isAdmin = user?.roles?.some(role => role.name === 'ADMIN') ?? false;

  return { 
    user, 
    loading, 
    login, 
    logout, 
    mounted,
    isAuthenticated,
    isAdmin,
    refreshProfile: fetchProfile
  };
};
