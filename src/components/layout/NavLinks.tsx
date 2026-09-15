'use client';

import Link from 'next/link';

interface NavItem {
    href: string;
    label: string;
}

const NAV_ITEMS: NavItem[] = [
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
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className='text-foreground hover:text-accent transition-colors py-2'
                        onClick={onLinkClick}
                    >
                        {item.label}
                    </Link>
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
            {NAV_ITEMS.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className='text-foreground hover:text-accent transition-colors'
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
