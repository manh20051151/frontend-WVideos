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
          setUser(JSON.parse(savedUser));
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
      
      if (userData && userData.id) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
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
