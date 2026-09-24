'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import videoApi, { type TrendingTag } from '@/lib/apis/video.api';

/**
 * Đám mây tags thịnh hành trên đầu trang chủ.
 * Tag càng nhiều lượt xem càng lớn (cỡ chữ scale theo căn bậc hai của views),
 * chip nghiêng ngẫu nhiên tạo cảm giác "bung nổ", click dẫn tới /tag/{tag}.
 */

const MAX_TAGS = 24;

const formatViews = (v: number): string => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}T`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}Tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}N`;
  return `${v}`;
};

export default function TrendingTags() {
    const [tags, setTags] = useState<TrendingTag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        videoApi
            .getTrendingTags(MAX_TAGS)
            .then((data) => {
                if (!cancelled) setTags(data ?? []);
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Chưa có data (đang tải hoặc chưa có tag) thì không chiếm chỗ
    if (loading || tags.length === 0) return null;

    const maxViews = tags[0]?.totalViews || 1;

    return (
        <div className='relative mb-10'>
            {/* Blobs sáng bị clip theo bo góc của card (nằm trong card + overflow-hidden) */}
            <div className='relative rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-transparent to-purple-500/10 px-4 sm:px-8 py-7 overflow-hidden'>
                <div className='pointer-events-none absolute -top-20 -left-10 w-56 h-56 bg-accent/20 rounded-full blur-3xl' />
                <div className='pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl' />

                {/* Header */}
                <div className='relative flex items-center justify-between gap-4 flex-wrap mb-5'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2.5 bg-gradient-to-br from-accent to-purple-500 rounded-xl -rotate-6 shadow-lg shadow-accent/30'>
                            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className='text-lg sm:text-xl font-bold text-foreground'>
                                Chủ Đề Bùng Nổ
                            </h2>
                            <p className='text-xs sm:text-sm text-foreground/60'>
                                Càng hot càng to — chạm để khám phá
                            </p>
                        </div>
                    </div>
                    <span className='text-[11px] font-medium uppercase tracking-wider text-foreground/40 border border-foreground/10 rounded-full px-3 py-1'>
                        {tags.length} tags
                    </span>
                </div>

                {/* Đám mây tags */}
                <div className='relative flex flex-wrap items-center justify-center gap-x-4 gap-y-3'>
                    {tags.map((t, i) => {
                        // Cỡ chữ scale theo căn bậc hai: phân bố đều hơn giữa hot và lạnh
                        const weight = Math.sqrt((t.totalViews || 0) / maxViews);
                        const fontSize = 0.85 + weight * 1.25; // 0.85rem -> 2.1rem
                        // Nghiêng ngẫu nhiên theo vị trí: -3.2 .. +3.2deg
                        const tilt = ((i % 5) - 2) * 1.6;
                        const isChampion = i === 0;
                        const isHot = i > 0 && i < 3;

                        return (
                            <Link
                                key={t.tag}
                                href={`/tag/${encodeURIComponent(t.tag)}`}
                                title={`${formatViews(t.totalViews)} lượt xem • ${t.videoCount} video`}
                                style={{
                                    fontSize: `${fontSize}rem`,
                                    animationDelay: `${i * 55}ms`,
                                    ['--tag-tilt' as string]: `${tilt}deg`,
                                }}
                                className={`tag-chip animate-tag-pop inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full font-semibold whitespace-nowrap ${
                                    isChampion
                                        ? 'bg-gradient-to-r from-accent to-purple-500 text-white shadow-lg shadow-accent/40'
                                        : isHot
                                          ? 'text-accent bg-accent/10 border border-accent/40'
                                          : 'bg-secondary text-foreground/80 border border-transparent hover:border-accent/40'
                                }`}
                            >
                                {isChampion && <span className='text-[0.8em] leading-none'>🔥</span>}
                                <span>#{t.tag}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
