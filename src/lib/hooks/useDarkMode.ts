'use client';

import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(true); // Mặc định là dark mode
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check localStorage first, nếu không có thì mặc định dark mode
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        const isDarkMode = savedMode === 'true';
        setIsDark(isDarkMode);
        document.documentElement.classList.toggle('dark', isDarkMode);
      } else {
        // Mặc định dark mode
        setIsDark(true);
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      const newMode = !isDark;
      setIsDark(newMode);
      localStorage.setItem('darkMode', String(newMode));
      document.documentElement.classList.toggle('dark', newMode);
    }
  };

  return { isDark, toggleDarkMode, mounted };
};
