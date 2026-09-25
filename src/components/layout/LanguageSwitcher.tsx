'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_NAMES, routing, type AppLocale } from '@/i18n/routing';

/**
 * Menu chọn ngôn ngữ toàn trang - đổi locale giữ nguyên trang đang xem.
 * vi là locale mặc định (không prefix URL), các ngôn ngữ khác có prefix /en, /zh...
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchTo = (newLocale: AppLocale) => {
    setOpen(false);
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div ref={ref} className='relative'>
      <button
        onClick={() => setOpen(!open)}
        aria-label='Language'
        title={LOCALE_NAMES[locale as AppLocale] ?? 'Language'}
        className='w-9 h-9 rounded-full flex items-center justify-center text-foreground/80 hover:text-accent hover:bg-secondary transition-colors'
      >
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18'
          />
        </svg>
      </button>

      {open && (
        <div className='absolute right-0 mt-2 w-44 rounded-xl bg-primary border border-accent shadow-lg py-1 z-50'>
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                l === locale
                  ? 'text-accent font-semibold'
                  : 'text-foreground/80 hover:text-accent hover:bg-secondary'
              }`}
            >
              {LOCALE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
