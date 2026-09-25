'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PublicVideoList from '@/components/video/PublicVideoList';
import { categoryApi } from '@/lib/apis/category.api';
import type { Category } from '@/lib/apis/category.api';

/**
 * Nội dung trang /category/{slug}: tra tên category rồi dùng chung
 * PublicVideoList (sort chips + phân trang + URL sync như trang chủ).
 */
export default function CategoryView() {
    const params = useParams();
    const slug = params.slug as string;
    const locale = useLocale();
    const t = useTranslations('Category');

    const [category, setCategory] = useState<Category | null>(null);

    useEffect(() => {
        let cancelled = false;
        categoryApi
            .getActiveCategories()
            .then((data) => {
                if (!cancelled) setCategory((data ?? []).find((c) => c.slug === slug) ?? null);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [slug, locale]);

    return (
        <>
            <Header />
            <div className='min-h-screen bg-primary'>
                <PublicVideoList
                    heading={category ? category.name : t('title')}
                    categorySlug={slug}
                    emptyMessage={t('empty')}
                />
            </div>
            <Footer />
        </>
    );
}
