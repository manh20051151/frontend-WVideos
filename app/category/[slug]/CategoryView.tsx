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
 * sort chips + phân trang numbered giống trang chủ (Pagination dùng chung),
 * ?page=N và ?sort= đồng bộ lên URL để share/lưu lại được.
 */

const PAGE_SIZE = 12;

type SortOption = 'newest' | 'popular' | 'favorites' | 'comments' | 'longest';

const ICONS: Record<SortOption, React.ReactNode> = {
    newest: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
    ),
    popular: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
        </svg>
    ),
    favorites: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
        </svg>
    ),
    comments: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
        </svg>
    ),
    longest: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
        </svg>
    ),
};

const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'newest', label: 'Mới nhất' },
    { key: 'popular', label: 'Xem nhiều' },
    { key: 'favorites', label: 'Yêu thích' },
    { key: 'comments', label: 'Bình luận' },
    { key: 'longest', label: 'Dài nhất' },
];

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
    const [sortBy, setSortBy] = useState<SortOption>(
        (searchParams.get('sort') as SortOption | null) || 'newest'
    );
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const [error, setError] = useState('');

    // Ref tới đầu lưới video để cuộn mượt khi đổi trang
    const gridTopRef = useRef<HTMLDivElement>(null);
    // Trang ban đầu từ URL ?page= (1-based như trang chủ), chỉ đọc 1 lần
    const initialPageRef = useRef(Math.max(1, parseInt(searchParams.get('page') || '1', 10)) - 1);
    // Lần nạp đầu sau khi vào category: dùng page từ URL, các lần đổi sort sau đó reset về trang 0
    const isFirstLoadRef = useRef(true);

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

    useEffect(() => {
        isFirstLoadRef.current = true;
    }, [slug]);

    const loadPage = useCallback(
        async (pageToLoad: number) => {
            if (pageToLoad === 0) setLoading(true);
            else setPageLoading(true);
            try {
                const data = await videoApi.getPublicVideos(pageToLoad, PAGE_SIZE, sortBy, slug);

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
        [slug, sortBy]
    );

    useEffect(() => {
        if (!slug) return;
        loadPage(isFirstLoadRef.current ? initialPageRef.current : 0);
        isFirstLoadRef.current = false;
    }, [slug, loadPage]);

    // Đồng bộ page + sort lên URL (giống trang chủ) để share/lưu lại được
    useEffect(() => {
        const urlParams = new URLSearchParams();
        if (page > 0) urlParams.set('page', String(page + 1));
        if (sortBy !== 'newest') urlParams.set('sort', sortBy);

        const queryString = urlParams.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;
        router.replace(url, { scroll: false });
    }, [page, sortBy, pathname, router]);

    const goToPage = (p: number) => {
        const target = Math.max(0, Math.min(p, totalPages - 1));
        if (target === page) return;
        loadPage(target);
        gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleSort = (key: SortOption) => {
        if (key === sortBy) return;
        setSortBy(key);
    };

    return (
        <>
            <Header />
            <div className='min-h-screen bg-primary'>
                <div className='container mx-auto px-4 py-8'>
                    <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
                        {/* Tiêu đề */}
                        <div className='flex items-center gap-3'>
                            <h1 className='text-xl sm:text-2xl font-bold text-foreground'>
                                {category ? category.name : 'Thể loại'}
                            </h1>
                        </div>

                        {/* Sort chips - cuộn ngang trên mobile, mép phải mờ gợi ý lướt */}
                        <div className='relative -mx-4 px-4 lg:mx-0 lg:px-0'>
                            <div className='overflow-x-auto scrollbar-hide'>
                                <div className='flex items-center gap-2 w-max lg:w-auto py-0.5'>
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.key}
                                            onClick={() => handleSort(option.key)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                                sortBy === option.key
                                                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                                                    : 'bg-secondary text-foreground/70 hover:text-foreground hover:bg-primary border border-accent/25'
                                            }`}
                                        >
                                            {ICONS[option.key]}
                                            <span>{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className='pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-primary via-primary/70 to-transparent lg:hidden' />
                        </div>
                    </div>

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
