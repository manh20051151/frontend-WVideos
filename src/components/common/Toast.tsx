'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const isSuccess = type === 'success';

  return (
    <div className='fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300'>
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-sm ${
          isSuccess
            ? 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-600/50'
            : 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-600/50'
        }`}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isSuccess
            ? 'bg-green-100 dark:bg-green-500/20'
            : 'bg-red-100 dark:bg-red-500/20'
        }`}>
          {isSuccess ? (
            <svg className='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
            </svg>
          ) : (
            <svg className='w-4 h-4 text-red-600 dark:text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className='flex-1 min-w-[200px] max-w-[300px]'>
          <p className={`text-sm font-medium ${
            isSuccess
              ? 'text-green-800 dark:text-green-100'
              : 'text-red-800 dark:text-red-100'
          }`}>
            {message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            isSuccess
              ? 'text-green-400 hover:text-green-600 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-200 dark:hover:bg-green-800'
              : 'text-red-400 hover:text-red-600 hover:bg-red-100 dark:text-red-300 dark:hover:text-red-200 dark:hover:bg-red-800'
          }`}
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      </div>
    </div>
  );
}
