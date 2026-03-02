'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';
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

const MENU_ITEMS = [
    {
        href: '/profile',
        label: 'Trang cá nhân',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
        href: '/my-videos',
        label: 'Video của tôi',
        icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    },
    {
        href: '/wallet',
        label: 'Ví của tôi',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    },
    {
        href: '/settings',
        label: 'Cài đặt',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
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

    return (
        <div className='relative' ref={menuRef}>
            <button
                onClick={onToggle}
                className='p-1 rounded-full hover:ring-2 hover:ring-accent transition-all'
            >
                <img
                    src={user.avatar || DEFAULT_AVATAR}
                    alt={user.fullName || user.username}
                    className='w-10 h-10 rounded-full object-cover border-2 border-accent'
                />
            </button>

            {isOpen && (
                <div className='absolute right-0 mt-2 w-56 bg-primary border-2 border-accent rounded-lg shadow-xl py-2 z-50'>
                    {/* User info */}
                    <div className='px-4 py-3 border-b border-accent'>
                        <p className='text-sm font-medium text-foreground'>{user.fullName || user.username}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>{user.email}</p>
                    </div>

                    {/* Menu items */}
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
