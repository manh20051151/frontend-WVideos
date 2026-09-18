'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { navItemApi, NavItem } from '@/lib/apis/navitem.api';

interface LocalNavItem {
    href: string;
    label: string;
    icon?: string;
    openNewTab?: boolean;
}

// Danh sách mặc định (fallback khi chưa có dữ liệu hoặc gọi API lỗi)
const DEFAULT_NAV_ITEMS: LocalNavItem[] = [
    { href: '/news', label: 'Tin tức' },
    { href: '/shorts', label: 'Shorts' },
    { href: '/kenh-da-dang-ky', label: 'Kênh Đã Đăng Ký' },
    { href: '/clip-sao-tao-noi-dung', label: 'Clip Sao Tạo Nội Dung' },
    { href: '/clip-sao-hat-nhep', label: 'Clip Sao Hát Nhép' },
    { href: '/anh-sao', label: 'Ảnh Sao' },
    { href: '/the-loai', label: 'Thể Loại' },
    { href: '/khac', label: 'Khác' },
    { href: '/dong-gop', label: 'Đóng Góp' },
    { href: '/thong-bao', label: 'Thông báo' },
];

interface NavLinksProps {
    /** Hiển thị theo chiều dọc (mobile menu) */
    vertical?: boolean;
    onLinkClick?: () => void;
}

export default function NavLinks({ vertical = false, onLinkClick }: NavLinksProps) {
    const [navItems, setNavItems] = useState<LocalNavItem[]>(DEFAULT_NAV_ITEMS);

    // Lấy danh sách menu đang hoạt động từ backend (đồng bộ với admin CRUD)
    useEffect(() => {
        let cancelled = false;
        const loadNavItems = async () => {
            try {
                const data = await navItemApi.getActiveNavItems();
                if (!cancelled && data && data.length > 0) {
                    setNavItems(
                        data.map((item: NavItem) => ({
                            href: item.href,
                            label: item.label,
                            icon: item.icon,
                            openNewTab: item.openNewTab,
                        }))
                    );
                }
            } catch (err) {
                // Giữ nguyên danh sách mặc định nếu gọi API thất bại
                console.error('Lỗi tải menu điều hướng:', err);
            }
        };
        loadNavItems();
        return () => {
            cancelled = true;
        };
    }, []);

    const renderLink = (item: LocalNavItem, className: string) => {
        const isShorts = item.href === '/shorts';
        const content = (
            <>
                {item.icon && <span className='mr-1'>{item.icon}</span>}
                {item.label}
                {isShorts && (
                    <span className='ml-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-white text-accent rounded-full'>
                        Mới
                    </span>
                )}
            </>
        );

        const linkClassName = isShorts
            ? 'relative inline-flex items-center gap-1.5 bg-accent text-white px-4 py-1.5 rounded-full font-semibold shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 animate-shorts-glow animate-shorts-bg shorts-shine'
            : className;

        if (item.openNewTab) {
            return (
                <a
                    href={item.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={linkClassName}
                    onClick={onLinkClick}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link href={item.href} className={linkClassName} onClick={onLinkClick}>
                {content}
            </Link>
        );
    };

    if (vertical) {
        return (
            <div className='flex flex-col gap-3'>
                <Link
                    href='/'
                    className='text-foreground hover:text-accent transition-colors py-2'
                    onClick={onLinkClick}
                >
                    Trang chủ
                </Link>
                {navItems.map((item) => (
                    <span key={item.href}>
                        {renderLink(
                            item,
                            'text-foreground hover:text-accent transition-colors py-2'
                        )}
                    </span>
                ))}
                <Link
                    href='/dang-clip'
                    className='text-foreground hover:text-accent transition-colors py-2'
                    onClick={onLinkClick}
                >
                    Đăng Clip / Hình Ảnh 📤
                </Link>
            </div>
        );
    }

    return (
        <nav className='hidden lg:flex items-center justify-around gap-6 py-2 text-sm border-t border-secondary h-12'>
            {navItems.map((item) => (
                <span key={item.href}>
                    {renderLink(
                        item,
                        'text-foreground hover:text-accent transition-colors'
                    )}
                </span>
            ))}
        </nav>
    );
}
