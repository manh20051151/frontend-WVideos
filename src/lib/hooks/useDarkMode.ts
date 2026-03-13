'use client';

import { useState, useEffect, useCallback } from 'react';

// Tạo một global event emitter để đồng bộ dark mode across components
const DARK_MODE_CHANGE_EVENT = 'darkmodechange';

// Global state để theo dõi dark mode
let globalIsDark = false;
let initialized = false;

const emitChange = (isDark: boolean) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DARK_MODE_CHANGE_EVENT, { detail: isDark }));
  }
};

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      // Khởi tạo từ localStorage chỉ 1 lần
      if (!initialized) {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode !== null) {
          globalIsDark = savedMode === 'true';
        } else {
          // Mặc định dark mode
          globalIsDark = true;
          localStorage.setItem('darkMode', 'true');
        }
        document.documentElement.classList.toggle('dark', globalIsDark);
        initialized = true;
      }
      
      // Set state từ global
      setIsDark(globalIsDark);

      // Lắng nghe sự kiện thay đổi từ các component khác
      const handleChange = (e: CustomEvent) => {
        setIsDark(e.detail);
      };
      
      window.addEventListener(DARK_MODE_CHANGE_EVENT, handleChange as EventListener);
      
      return () => {
        window.removeEventListener(DARK_MODE_CHANGE_EVENT, handleChange as EventListener);
      };
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    if (typeof window !== 'undefined') {
      const newMode = !isDark;
      globalIsDark = newMode;
      setIsDark(newMode);
      localStorage.setItem('darkMode', String(newMode));
      document.documentElement.classList.toggle('dark', newMode);
      emitChange(newMode);
    }
  }, [isDark]);

  return { isDark, toggleDarkMode, mounted };
};
