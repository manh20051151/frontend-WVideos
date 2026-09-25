'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { navItemApi, NavItem } from '@/lib/apis/navitem.api';
import { categoryApi, type Category } from '@/lib/apis/category.api';

interface LocalNavItem {
    href: string;
    /** Nhãn lấy từ API (admin cấu hình) */
    label?: string;
    /** Key dịch cho item mặc định khi API lỗi/chưa cấu hình */
    labelKey?: 'news' | 'shorts' | 'subscribedVideos';
    icon?: string;
    openNewTab?: boolean;
}

// Item mặc định (fallback khi chưa có dữ liệu hoặc gọi API lỗi).
// Nhãn hiển thị qua next-intl theo ngôn ngữ trang.
// Giữ tối giản để không làm tràn layout mobile khi API tạm lỗi
const DEFAULT_NAV_ITEMS: LocalNavItem[] = [
    { href: '/news', labelKey: 'news' },
    { href: '/shorts', labelKey: 'shorts' },
    { href: '/kenh-da-dang-ky', labelKey: 'subscribedVideos' },
];

interface NavLinksProps {
    /** Hiển thị theo chiều dọc (mobile menu) */
    vertical?: boolean;
    onLinkClick?: () => void;
}

/**
 * Dropdown "Thể loại" trên nav desktop:
 * - Nút dạng pill, đổi màu khi mở, icon lưới + chevron xoay khi active.
 * - Panel backdrop-blur, animation fade+scale, mỗi category có chấm màu riêng (nếu cấu hình).
 */
function CategoryDropdown() {
    const locale = useLocale();
    const t = useTranslations('Nav');
    const [categories, setCategories] = useState<Category[]>([]);
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let cancelled = false;
        categoryApi
            .getActiveCategories()
            .then((data) => {
                if (!cancelled) setCategories((data ?? []).filter((c) => c.isActive));
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [locale]);

    // Trễ đóng để chuột kịp di chuyển từ nút sang menu
    const scheduleClose = () => {
        timeoutRef.current = setTimeout(() => setOpen(false), 150);
    };
    const cancelClose = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    if (categories.length === 0) return null;

    return (
        <span
            className='relative'
            onMouseEnter={() => {
                cancelClose();
                setOpen(true);
            }}
            onMouseLeave={() => {
                cancelClose();
                scheduleClose();
            }}
        >
            <button
                type='button'
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                    open ? 'text-accent bg-accent/10' : 'text-foreground hover:bg-secondary hover:text-accent'
                }`}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup='true'
            >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.8}
                        d='M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'
                    />
                </svg>
                {t('categories')}
                <svg
                    className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M19 9l-7 7-7-7' />
                </svg>
            </button>

            <div
                className={`absolute left-1/2 -translate-x-1/2 top-full pt-2.5 z-50 origin-top transition-all duration-200 ${
                    open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'
                }`}
            >
                <div className='bg-primary/95 backdrop-blur-md border border-secondary shadow-2xl rounded-xl p-1.5 min-w-[200px] max-h-[70vh] overflow-y-auto'>
                    {categories.map((c) => (
                        <Link
                            key={c.id}
                            href={`/category/${c.slug}`}
                            className='group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent/10 hover:text-accent transition-colors whitespace-nowrap'
                        >
                            <span
                                className='w-2 h-2 rounded-full shrink-0 bg-accent'
                                style={c.color ? { backgroundColor: c.color } : undefined}
                            />
                            <span className='flex-1'>{c.name}</span>
                            <svg
                                className='w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                            </svg>
                        </Link>
                    ))}
                </div>
            </div>
        </span>
    );
}

export default function NavLinks({ vertical = false, onLinkClick }: NavLinksProps) {
    const locale = useLocale();
    const t = useTranslations('Nav');
    const [navItems, setNavItems] = useState<LocalNavItem[]>(DEFAULT_NAV_ITEMS);
    const [categories, setCategories] = useState<Category[]>([]);

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
            }
        };
        loadNavItems();
        return () => {
            cancelled = true;
        };
    }, []);

    // Lấy categories cho menu dọc (mobile)
    useEffect(() => {
        if (!vertical) return;
        let cancelled = false;
        categoryApi
            .getActiveCategories()
            .then((data) => {
                if (!cancelled) setCategories((data ?? []).filter((c) => c.isActive));
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [vertical, locale]);

    const renderLink = (item: LocalNavItem, className: string) => {
        const isShorts = item.href === '/shorts';
        const label = item.label ?? (item.labelKey ? t(item.labelKey) : '');
        const content = (
            <>
                {item.icon && <span className='mr-1'>{item.icon}</span>}
                {label}
                {isShorts && (
                    <span className='ml-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-white text-accent rounded-full'>
                        {t('newBadge')}
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
                {navItems.map((item) => (
                    <span key={item.href}>
                        {renderLink(
                            item,
                            'text-foreground hover:text-accent transition-colors py-2'
                        )}
                    </span>
                ))}

                {/* Thể loại - menu dọc mobile */}
                {categories.length > 0 && (
                    <div className='flex flex-col gap-1 pt-1 border-t border-secondary'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-foreground opacity-50 py-1'>
                            {t('categories')}
                        </p>
                        {categories.map((c) => (
                            <Link
                                key={c.id}
                                href={`/category/${c.slug}`}
                                onClick={onLinkClick}
                                className='text-foreground hover:text-accent transition-colors py-1.5 pl-3'
                            >
                                {c.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <nav className='hidden lg:flex items-center justify-around gap-6 py-2 text-sm border-t border-secondary h-12'>
            <CategoryDropdown />
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
