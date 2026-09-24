'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import videoApi from '@/lib/apis/video.api';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import VideoCardLite from '@/components/video/VideoCardLite';
import TrendingTags from '@/components/video/TrendingTags';
import Pagination from '@/components/common/Pagination';

const FireIcon = () => (
  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' />
  </svg>
);

const ClockIcon = () => (
  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
  </svg>
);

const EyeIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
  </svg>
);

const HeartIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
  </svg>
);

const CommentIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
  </svg>
);

const LongIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' />
  </svg>
);

type SortOption = 'newest' | 'popular' | 'favorites' | 'comments' | 'longest';

const sortOptions: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  { key: 'newest', label: 'Mới nhất', icon: <ClockIcon /> },
  { key: 'popular', label: 'Xem nhiều', icon: <EyeIcon /> },
  { key: 'favorites', label: 'Yêu thích', icon: <HeartIcon /> },
  { key: 'comments', label: 'Bình luận', icon: <CommentIcon /> },
  { key: 'longest', label: 'Dài nhất', icon: <LongIcon /> },
];

const SkeletonCard = () => {
  const { isDark } = useDarkMode();
  return (
    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white shadow'} animate-pulse`}>
      <div className='aspect-video bg-gray-300 dark:bg-gray-700' />
      <div className='p-4 space-y-3'>
        <div className='h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4' />
        <div className='h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2' />
      </div>
    </div>
  );
};

const getSortLabel = (key: SortOption): string => {
  const labels: Record<SortOption, string> = {
    newest: 'Mới nhất',
    popular: 'Xem nhiều',
    favorites: 'Yêu thích',
    comments: 'Bình luận',
    longest: 'Dài nhất',
  };
  return labels[key];
};

function HomeContent() {
  const { isDark } = useDarkMode();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSort = searchParams.get('sort') as SortOption | null;

  const [latestPage, setLatestPage] = useState(Math.max(1, initialPage) - 1);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort || 'newest');

  // Ref tới section "Video mới nhất" để cuộn tới đầu section khi đổi trang
  const latestSectionRef = useRef<HTMLDivElement>(null);

  // Sync URL params with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (latestPage > 0) params.set('page', String(latestPage + 1));
    if (sortBy !== 'newest') params.set('sort', sortBy);

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(url, { scroll: false });
  }, [latestPage, sortBy, pathname, router]);

  const goToPage = (page: number) => {
    setLatestPage(Math.max(0, Math.min(page, latestTotalPages - 1)));
    latestSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['trendingVideos'],
      queryFn: () => videoApi.getTrendingVideos(0, 16),
    });
    queryClient.prefetchQuery({
      queryKey: ['latestVideos', 0, sortBy],
      queryFn: () => videoApi.getAllVideos(0, 32, sortBy),
    });
  }, [queryClient, sortBy]);

  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ['trendingVideos'],
    queryFn: () => videoApi.getTrendingVideos(0, 16),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: latestData, isLoading: loadingLatest } = useQuery({
    queryKey: ['latestVideos', latestPage, sortBy],
    queryFn: () => videoApi.getAllVideos(latestPage, 32, sortBy),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const trendingVideos = trendingData?.content || [];
  const latestVideos = latestData?.content || [];
  const latestTotalPages = latestData?.totalPages || 0;

  return (
    <>
      <Header />
      <main className='flex-1 bg-primary'>
        <div className='container mx-auto px-4 py-8'>
          {/* Đám mây tags thịnh hành */}
          <TrendingTags />

          {/* Section: Đang được xem (Trending) */}
          <div className='mb-12'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-orange-500/20 rounded-lg'>
                <FireIcon />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-foreground'>Đang được xem</h2>
                <p className='text-sm text-foreground/60'>Video được xem nhiều nhất</p>
              </div>
            </div>

            {loadingTrending ? (
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : trendingVideos.length === 0 ? (
              <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <p className='text-foreground/60'>Chưa có video trending</p>
              </div>
            ) : (
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full'>
                {trendingVideos.map((video: any) => (
                  <VideoCardLite key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>

          {/* Section: Video mới nhất */}
          <div ref={latestSectionRef} className='scroll-mt-20'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
              {/* Tiêu đề */}
              <div className='flex items-center gap-3'>
                <div className='p-2.5 bg-accent/10 text-accent rounded-xl'>
                  <ClockIcon />
                </div>
                <div>
                  <h2 className='text-xl sm:text-2xl font-bold text-foreground'>Video mới nhất</h2>
                  <p className='text-sm text-foreground/60'>Cập nhật liên tục</p>
                </div>
              </div>

              {/* Sort Options - chip cuộn ngang, mép phải mờ để gợi ý lướt */}
              <div className='relative -mx-4 px-4 lg:mx-0 lg:px-0'>
                <div className='overflow-x-auto scrollbar-hide'>
                  <div className='flex items-center gap-2 w-max lg:w-auto py-0.5'>
                    {sortOptions.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSortBy(option.key);
                          setLatestPage(0);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                          sortBy === option.key
                            ? 'bg-accent text-white shadow-md shadow-accent/25'
                            : 'bg-secondary text-foreground/70 hover:text-foreground hover:bg-primary border border-accent/25'
                        }`}
                      >
                        {option.icon}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Mờ mép phải: gợi ý còn chip để lướt ngang */}
                <div className='pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-primary via-primary/70 to-transparent lg:hidden' />
              </div>
            </div>

            {loadingLatest ? (
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {[...Array(32)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : latestVideos.length === 0 ? (
              <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mb-4`}>
                  <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-foreground mb-2'>Chưa có video nào</h3>
                <p className='text-foreground/60 mb-4'>Hãy là người đầu tiên chia sẻ video!</p>
                <Link
                  href='/upload'
                  className='inline-flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-full transition-all'
                >
                  Upload video
                </Link>
              </div>
            ) : (
              <>
<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full'>
                  {latestVideos.map((video: any) => (
                  <VideoCardLite key={video.id} video={video} />
                  ))}
                </div>

                {latestTotalPages > 1 && (
                  <Pagination currentPage={latestPage} totalPages={latestTotalPages} onPageChange={goToPage} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// useSearchParams() cần bọc Suspense để build production không lỗi prerender
export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
