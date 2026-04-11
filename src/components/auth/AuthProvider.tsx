'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthModal from './AuthModal';

type AuthTab = 'login' | 'register';

interface AuthContextType {
  openAuthModal: (tab?: AuthTab) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<AuthTab>('login');

  useEffect(() => {
    const handleShowAuthModal = (e: CustomEvent<{ tab?: AuthTab }>) => {
      setDefaultTab(e.detail?.tab || 'login');
      setIsOpen(true);
    };

    window.addEventListener('show-auth-modal', handleShowAuthModal as EventListener);
    return () => window.removeEventListener('show-auth-modal', handleShowAuthModal as EventListener);
  }, []);

  return (
    <AuthContext.Provider value={{ openAuthModal: (tab = 'login') => {
      setDefaultTab(tab);
      setIsOpen(true);
    }}}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultTab={defaultTab}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function openAuthModal(tab: AuthTab = 'login') {
  window.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { tab } }));
}