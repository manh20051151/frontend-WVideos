'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import type { UserResponse } from '@/types';

interface UserDropdownProps {
    user: UserResponse;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onLogout: () => void;
}

const DEFAULT_AVATAR =
    'https://res.cloudinary.com/dnvtmbmne/image/upload/v1744707484/et5vc9r9fejjgrjsvxyn.jpg';

const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value ?? 0);
};

const MENU_ITEMS = [
    {
        href: '/profile?tab=personal',
        label: 'Thông tin cá nhân',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
        href: '/profile?tab=my-videos',
        label: 'Video của tôi',
        icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    },
    {
        href: '/profile?tab=analytics',
        label: 'Thống kê kênh',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
        href: '/profile?tab=liked',
        label: 'Video đã thích',
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
    {
        href: '/profile?tab=purchased',
        label: 'Video đã mua',
        icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    },
    {
        href: '/profile?tab=finance',
        label: 'Tài chính',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    },
    {
        href: '/profile?tab=channels',
        label: 'Kênh đã đăng ký',
        icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z',
    },
    {
        href: '/profile?tab=notifications',
        label: 'Thông báo',
        icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    },
    {
        href: '/profile?tab=password',
        label: 'Đổi mật khẩu',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    },
];

// Admin menu items (chỉ hiện cho admin)
const ADMIN_MENU_ITEMS = [
    {
        href: '/admin/dashboard',
        label: '🎛️ Dashboard Admin',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
];

export default function UserDropdown({ user, isOpen, onToggle, onClose, onLogout }: UserDropdownProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const [avatarError, setAvatarError] = useState(false);

    return (
        <div className='relative' ref={menuRef}>
            <button
                onClick={onToggle}
                className='p-1 rounded-full hover:ring-2 hover:ring-accent transition-all'
            >
                <img
                    src={!avatarError ? (user.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR}
                    alt={user.fullName || user.email}
                    className='w-10 h-10 rounded-full object-cover border-2 border-accent'
                    onError={() => setAvatarError(true)}
                />
            </button>

            {isOpen && (
                <div className='absolute right-0 mt-2 w-56 bg-primary border-2 border-accent rounded-lg shadow-xl py-2 z-50 max-h-[80vh] overflow-y-auto overscroll-contain'>
                    {/* User info */}
                    <div className='px-4 py-3 border-b border-accent'>
                        <p className='text-sm font-medium text-foreground'>{user.fullName || user.email}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>{user.email}</p>
                        <div className='mt-2 space-y-0.5'>
                            <div className='flex justify-between items-center'>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>Số dư</span>
                                <span className='text-xs font-semibold text-green-600'>{formatCurrency(user.balance)}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>Doanh thu</span>
                                <span className='text-xs font-semibold text-foreground'>{formatCurrency(user.revenue)}</span>
                            </div>
                        </div>
                        {user.roles?.some(role => role.name === 'ADMIN') && (
                            <span className='inline-block mt-2 px-2 py-1 text-xs bg-highlight text-white rounded-full'>
                                Admin
                            </span>
                        )}
                    </div>

                    {/* Admin menu items (chỉ hiện cho admin) */}
                    {user.roles?.some(role => role.name === 'ADMIN') && (
                        <>
                            {ADMIN_MENU_ITEMS.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className='flex items-center gap-2 px-4 py-2 text-foreground hover:bg-secondary transition-colors font-medium'
                                    onClick={onClose}
                                >
                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={item.icon} />
                                    </svg>
                                    {item.label}
                                </Link>
                            ))}
                            <hr className='my-2 border-accent' />
                        </>
                    )}

                    {/* Regular menu items */}
                    {MENU_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className='flex items-center gap-2 px-4 py-2 text-foreground hover:bg-secondary transition-colors'
                            onClick={onClose}
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={item.icon} />
                            </svg>
                            {item.label}
                        </Link>
                    ))}

                    <hr className='my-2 border-accent' />

                    <button
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                        className='flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:bg-secondary transition-colors'
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                            />
                        </svg>
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
}
