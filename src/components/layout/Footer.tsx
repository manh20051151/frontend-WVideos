import Link from 'next/link';
import SiteLogo from './SiteLogo';

const QUICK_LINKS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Shorts', href: '/shorts' },
  { label: 'Tin tức', href: '/news' },
  { label: 'Thể loại', href: '/the-loai' },
  { label: 'Kênh đã đăng ký', href: '/kenh-da-dang-ky' },
];

const SUPPORT_LINKS = [
  { label: 'Về chúng tôi', href: '#' },
  { label: 'Điều khoản sử dụng', href: '#' },
  { label: 'Chính sách bảo mật', href: '#' },
  { label: 'Trợ giúp', href: '#' },
  { label: 'Liên hệ', href: '#' },
];

const CATEGORIES = [
  { label: 'Tin tức', href: '/news' },
  { label: 'Shorts', href: '/shorts' },
  { label: 'Clip Sao', href: '/clip-sao-tao-noi-dung' },
  { label: 'Ảnh Sao', href: '/anh-sao' },
  { label: 'Âm nhạc', href: '#' },
];

const SOCIALS = [
  {
    name: 'Facebook',
    href: '#',
    path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z',
  },
  {
    name: 'YouTube',
    href: '#',
    path: 'M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.38.48A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12C4.5 20.4 12 20.4 12 20.4s7.5 0 9.38-.48a3 3 0 0 0 2.12-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z',
  },
  {
    name: 'TikTok',
    href: '#',
    path: 'M16.5 3c.3 2.1 1.5 3.9 3.5 4.2v3.1c-1.3.1-2.5-.3-3.6-.9v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.2a2.5 2.5 0 1 0 1.7 2.4V3h3.1Z',
  },
  {
    name: 'Instagram',
    href: '#',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4a3.8 3.8 0 0 1-1.4-.9 3.8 3.8 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.8.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2.1C2.7 10.5 2.7 10.9 2.7 12s0 1.5.1 2.7c.1 1.1.2 1.7.4 2.1.2.5.4.8.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.8-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1a3.2 3.2 0 0 0-.8-1.2 3.2 3.2 0 0 0-1.2-.8c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.2-3.3a1.1 1.1 0 1 1 0 2.3 1.1 1.1 0 0 1 0-2.3Z',
  },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  const isInternal = href.startsWith('/');
  const className =
    'text-sm text-foreground/70 hover:text-accent transition-colors duration-200';

  if (isInternal) {
    return (
      <li>
        <Link href={href} className={className}>
          {label}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <a href={href} className={className}>
        {label}
      </a>
    </li>
  );
}

export default function Footer() {
  return (
    <footer className='bg-secondary border-t border-accent mt-auto'>
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12'>
          {/* Brand */}
          <div className='sm:col-span-2 lg:col-span-1'>
            <Link href='/' className='inline-flex items-center gap-2 mb-4'>
              <SiteLogo
                imgClassName='h-9 w-auto max-w-[140px] object-contain'
                fallback={
                  <>
                    <span className='text-accent text-2xl font-extrabold'>w</span>
                    <span className='text-highlight text-2xl font-extrabold'>video</span>
                  </>
                }
              />
            </Link>
            <p className='text-sm text-foreground/70 leading-relaxed max-w-xs'>
              Nền tảng chia sẻ video hàng đầu Việt Nam. Khám phá hàng triệu
              nội dung sáng tạo mỗi ngày.
            </p>
            <div className='flex items-center gap-3 mt-5'>
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className='w-9 h-9 rounded-full bg-primary border border-accent flex items-center justify-center text-foreground/70 hover:text-accent hover:border-accent transition-colors duration-200'
                >
                  <svg viewBox='0 0 24 24' className='w-4 h-4' fill='currentColor'>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className='text-sm font-semibold uppercase tracking-wider text-foreground mb-4'>
              Liên kết nhanh
            </h4>
            <ul className='space-y-2.5'>
              {QUICK_LINKS.map((l) => (
                <FooterLink key={l.label} {...l} />
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className='text-sm font-semibold uppercase tracking-wider text-foreground mb-4'>
              Danh mục
            </h4>
            <ul className='space-y-2.5'>
              {CATEGORIES.map((l) => (
                <FooterLink key={l.label} {...l} />
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className='text-sm font-semibold uppercase tracking-wider text-foreground mb-4'>
              Hỗ trợ
            </h4>
            <ul className='space-y-2.5'>
              {SUPPORT_LINKS.map((l) => (
                <FooterLink key={l.label} {...l} />
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-10 pt-6 border-t border-accent flex flex-col sm:flex-row items-center justify-between gap-4'>
          <p className='text-sm text-foreground/60'>
            © {new Date().getFullYear()} WVideos. All rights reserved.
          </p>
          <div className='flex items-center gap-5 text-sm text-foreground/60'>
            <a href='#' className='hover:text-accent transition-colors duration-200'>
              Điều khoản
            </a>
            <a href='#' className='hover:text-accent transition-colors duration-200'>
              Bảo mật
            </a>
            <a href='#' className='hover:text-accent transition-colors duration-200'>
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
