import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// Tiền render tĩnh cho từng locale
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: {
      absolute: t('title'),
      template: '%s | snha',
    },
    description: t('description'),
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : locale,
      siteName: 'snha',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      {children}
      {/* Đồng bộ thuộc tính lang của <html> theo locale đang xem */}
      <script
        dangerouslySetInnerHTML={{ __html: `document.documentElement.lang='${locale}';` }}
      />
    </NextIntlClientProvider>
  );
}
