import type { Metadata } from 'next';
import { Suspense } from 'react';
import CategoryView from './CategoryView';

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

async function getCategories(): Promise<SeoCategory[]> {
    try {
        const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 600 } });
        if (!res.ok) return [];
        const body = await res.json();
        const list = body?.result ?? body;
        return Array.isArray(list) ? (list as SeoCategory[]) : [];
    } catch {
        return [];
    }
}

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const categories = await getCategories();
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        return {
            title: 'Thể loại không tồn tại',
            robots: { index: false },
        };
    }

    return {
        title: category.name,
        description:
            (category.description || '').slice(0, 160) ||
            `Xem các video thể loại ${category.name} trên snha.`,
        alternates: { canonical: `/category/${category.slug}` },
        openGraph: {
            type: 'website',
            title: category.name,
            url: `${SITE_URL}/category/${category.slug}`,
        },
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const categories = await getCategories();
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
