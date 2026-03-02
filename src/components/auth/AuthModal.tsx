'use client';

import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

type AuthTab = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: AuthTab;
  onLoginSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onLoginSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);
  const [successMessage, setSuccessMessage] = useState('');

  // Cập nhật activeTab khi defaultTab thay đổi
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSuccessMessage('');
    }
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setSuccessMessage('');
  };

  const handleLoginSuccess = () => {
    onLoginSuccess?.();
    setTimeout(() => onClose(), 500);
  };

  const handleRegisterSuccess = (message: string) => {
    setSuccessMessage(message);
    setActiveTab('login');
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-primary rounded-lg shadow-xl w-full max-w-md mx-4 relative'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-foreground hover:text-accent transition-colors'
        >
          <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>

        {/* Tabs */}
        <div className='flex border-b border-secondary'>
          {(['login', 'register'] as AuthTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === tab
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-foreground hover:text-accent'
                }`}
            >
              {tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        {/* Form content */}
        <div className='p-6'>
          {successMessage && (
            <div className='mb-4 p-3 bg-secondary border border-accent text-accent rounded-lg text-sm'>
              {successMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => handleTabChange('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => handleTabChange('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
