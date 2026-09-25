import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import CategoryView from './CategoryView';
import { routing } from '@/i18n/routing';

/**
 * Server component cho trang /category/{slug}:
 * - generateMetadata: title theo tên category.
 * - UI interactive nằm ở CategoryView (client).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';

interface SeoCategory {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
}

async function getCategories(locale: string): Promise<SeoCategory[]> {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            next: { revalidate: 600 },
            headers: { 'Accept-Language': locale },
        });
        if (!res.ok) return [];
        const body = await res.json();
        const list = body?.result ?? body;
        return Array.isArray(list) ? (list as SeoCategory[]) : [];
    } catch {
        return [];
    }
}

interface CategoryPageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug, locale } = await params;
    const [categories, t] = await Promise.all([
        getCategories(locale),
        getTranslations({ locale, namespace: 'Category' }),
    ]);
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        return {
            title: t('title'),
            robots: { index: false },
        };
    }

    return {
        title: category.name,
        description:
            (category.description || '').slice(0, 160) ||
            t('metaDescription', { name: category.name }),
        alternates: {
            canonical: `/category/${category.slug}`,
            // hreflang: vi ở root, các locale khác có prefix
            languages: Object.fromEntries(
                routing.locales.map((l) => [
                    l,
                    l === routing.defaultLocale
                        ? `/category/${category.slug}`
                        : `/${l}/category/${category.slug}`,
                ])
            ),
        },
        openGraph: {
            type: 'website',
            title: category.name,
            url: `${SITE_URL}/category/${category.slug}`,
        },
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug, locale } = await params;
    const categories = await getCategories(locale);
    const category = categories.find((c) => c.slug === slug);

    const jsonLd = category
        ? {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: category.name,
              url: `${SITE_URL}/category/${category.slug}`,
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <Suspense>
                <CategoryView />
            </Suspense>
        </>
    );
}
