'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import videoApi, { type VideoResponse } from '@/lib/apis/video.api';
import type { PageResponse } from '@/types';

interface RelatedVideosSectionProps {
  currentVideoId: string;
  size?: number;
}

export default function RelatedVideosSection({ currentVideoId, size = 15 }: RelatedVideosSectionProps) {
  const { data: relatedVideosData, isLoading } = useQuery({
    queryKey: ['relatedVideos', currentVideoId],
    queryFn: () => videoApi.getRelatedVideos(currentVideoId, 0, size),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatViews = (views: number | null | undefined) => {
    const viewCount = views || 0;
    if (viewCount >= 1000000) {
      return `${(viewCount / 1000000).toFixed(1)}M lượt xem`;
    }
    if (viewCount >= 1000) {
      return `${(viewCount / 1000).toFixed(1)}N lượt xem`;
    }
    return `${viewCount} lượt xem`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '1 ngày trước';
    } else if (diffDays < 30) {
      return `${diffDays} ngày trước`;
    } else {
      const months = Math.floor(diffDays / 30);
      if (months === 1) {
        return '1 tháng trước';
      } else {
        return `${months} tháng trước`;
      }
    }
  };

  return (
    <div className='space-y-4'>
      {isLoading ? (
        // Loading skeleton
        [...Array(3)].map((_, i) => (
          <div key={i} className='bg-secondary rounded-lg p-4 animate-pulse'>
            <div className='aspect-video bg-black rounded-lg mb-3'></div>
            <div className='h-4 bg-black/20 rounded w-3/4 mb-2'></div>
            <div className='h-3 bg-black/20 rounded w-1/2'></div>
          </div>
        ))
      ) : relatedVideosData?.content && relatedVideosData.content.length > 0 ? (
        relatedVideosData.content.map((relatedVideo) => (
          <Link
            key={relatedVideo.id}
            href={relatedVideo.slug ? `/watch/${relatedVideo.slug}` : `/watch/${relatedVideo.id}`}
            className='block group'
          >
            <div className='bg-secondary rounded-lg p-4 hover:bg-accent/10 transition-colors'>
              <div className='aspect-video bg-black rounded-lg mb-3 relative overflow-hidden'>
                {relatedVideo.thumbnailUrl ? (
                  <Image
                    src={relatedVideo.thumbnailUrl}
                    alt={relatedVideo.title}
                    fill
                    className='object-cover group-hover:scale-105 transition-transform duration-200'
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <svg className='w-10 h-10 text-white opacity-50' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M8 5v14l11-7z'/>
                    </svg>
                  </div>
                )}
                <div className='absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded'>
                  {relatedVideo.duration ? formatDuration(relatedVideo.duration) : 'N/A'}
                </div>
              </div>
              <h4 className='font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors'>
                {relatedVideo.title}
              </h4>
              <div className='flex items-center justify-between text-xs text-foreground opacity-70 mt-1'>
                <span>{formatViews(relatedVideo.views)}</span>
                {relatedVideo.createdAt && <span className='ml-auto'>{formatDate(relatedVideo.createdAt)}</span>}
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className='bg-secondary rounded-lg p-4 text-center'>
          <p className='text-foreground opacity-60'>Không có video liên quan</p>
        </div>
      )}
    </div>
  );
}