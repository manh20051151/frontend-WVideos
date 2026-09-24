'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VideoCard from '@/components/video/VideoCard';
import Pagination from '@/components/common/Pagination';
import videoApi, { type VideoResponse } from '@/lib/apis/video.api';
import { categoryApi } from '@/lib/apis/category.api';
import type { Category } from '@/lib/apis/category.api';

/**
 * Nội dung trang /category/{slug}: lưới video công khai của category,
 * phân trang numbered giống trang chủ (component Pagination dùng chung),
 * số trang đồng bộ lên URL ?page=N để share/lưu lại được.
 */

const PAGE_SIZE = 12;

export default function CategoryView() {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [category, setCategory] = useState<Category | null>(null);
    const [videos, setVideos] = useState<VideoResponse[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const [error, setError] = useState('');

    // Ref tới đầu lưới video để cuộn mượt khi đổi trang
    const gridTopRef = useRef<HTMLDivElement>(null);
    // Trang ban đầu từ URL ?page= (1-based như trang chủ), chỉ đọc 1 lần
    const initialPageRef = useRef(Math.max(1, parseInt(searchParams.get('page') || '1', 10)) - 1);

    // Lấy category để hiện tên (public API trả danh sách, tìm theo slug)
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
    }, [slug]);

    const loadPage = useCallback(
        async (pageToLoad: number) => {
            if (pageToLoad === 0) setLoading(true);
            else setPageLoading(true);
            try {
                const data = await videoApi.getPublicVideos(pageToLoad, PAGE_SIZE, 'newest', slug);

                // Deep-link vào số trang vượt quá tổng số trang: nạp về trang cuối hợp lệ
                if (data.totalPages > 0 && pageToLoad > data.totalPages - 1) {
                    loadPage(data.totalPages - 1);
                    return;
                }

                setVideos(data.content);
                setTotalPages(data.totalPages);
                setPage(pageToLoad);
                setError('');
            } catch {
                setError('Không tải được danh sách video. Vui lòng thử lại.');
            } finally {
                setLoading(false);
                setPageLoading(false);
            }
        },
        [slug]
    );

    useEffect(() => {
        if (slug) loadPage(initialPageRef.current);
    }, [slug, loadPage]);

    // Đồng bộ số trang lên URL ?page=N (giống trang chủ) để share/lưu lại được
    useEffect(() => {
        const urlParams = new URLSearchParams();
        if (page > 0) urlParams.set('page', String(page + 1));

        const queryString = urlParams.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;
        router.replace(url, { scroll: false });
    }, [page, pathname, router]);

    const goToPage = (p: number) => {
        const target = Math.max(0, Math.min(p, totalPages - 1));
        if (target === page) return;
        loadPage(target);
        gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <Header />
            <div className='min-h-screen bg-primary'>
                <div className='container mx-auto px-4 py-8'>
                    <h1 className='text-2xl font-bold text-foreground mb-6'>
                        {category ? category.name : 'Thể loại'}
                    </h1>

                    {loading ? (
                        <div className='text-center py-16 text-foreground opacity-60'>
                            Đang tải...
                        </div>
                    ) : error ? (
                        <div className='text-center py-16'>
                            <p className='text-foreground opacity-70 mb-4'>{error}</p>
                            <button
                                onClick={() => loadPage(0)}
                                className='btn-accent px-4 py-2 rounded-lg font-medium'
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className='text-center py-16'>
                            <p className='text-foreground opacity-70 mb-4'>
                                Chưa có video nào trong thể loại này.
                            </p>
                            <Link href='/' className='btn-accent px-4 py-2 rounded-lg font-medium'>
                                Về trang chủ
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div ref={gridTopRef} className='scroll-mt-20' />

                            <div
                                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-200 ${
                                    pageLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                                }`}
                            >
                                {videos.map((v) => (
                                    <VideoCard
                                        key={v.id}
                                        video={v}
                                        onEdit={() => {}}
                                        onDelete={() => {}}
                                    />
                                ))}
                            </div>

                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                            />
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
