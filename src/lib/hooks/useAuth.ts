'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/apis/auth.api';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [mounted]);

  const fetchProfile = async () => {
    try {
      const data = await authApi.getProfile();
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await authApi.login({ username, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user);
    return data;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    setUser(null);
  };

  return { user, loading, login, logout, mounted };
};
