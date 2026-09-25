import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';

// Trang quản trị không được index
export const metadata: Metadata = {
  title: 'Quản trị',
  robots: { index: false, follow: false },
};

// Admin nằm ngoài app/[locale] nên không có intl context mặc định,
// nhưng vẫn dùng chung Header (có component next-intl như NavLinks).
// Bọc provider để các hook useLocale/useTranslations chạy được;
// request config tự fallback locale mặc định 'vi' (admin giữ 1 ngôn ngữ).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
