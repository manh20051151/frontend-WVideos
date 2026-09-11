'use client';

import Link from 'next/link';
import HoverThumbnail from '@/components/common/HoverThumbnail';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import type { VideoResponse } from '@/lib/apis/video.api';

interface VideoCardLiteProps {
  video: VideoResponse;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
  if (diffMonths < 12) return `${diffMonths} tháng trước`;
  return date.toLocaleDateString('vi-VN');
};

export default function VideoCardLite({ video }: VideoCardLiteProps) {
  const { isDark } = useDarkMode();

  return (
    <Link href={`/watch/${video.id}`} className='group block'>
      <div className={`rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full flex flex-col ${
        isDark ? 'bg-gray-800 shadow-black/50' : 'bg-white shadow-lg shadow-gray-200/50'
      }`}>
        <div className='relative w-full pb-[56.25%] flex-shrink-0'>
          <div className='absolute inset-0'>
            <HoverThumbnail
              thumbnailUrl={video.thumbnailUrl}
              splashImageUrl={video.splashImageUrl}
              alt={video.title}
              title={video.title}
              className='w-full h-full'
            />
          </div>
          {video.duration > 0 && (
            <span className='absolute bottom-2 right-2 z-30 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded'>
              {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
            </span>
          )}
          {!video.isPublic && (
            <div className='absolute top-2 right-2 z-30 bg-black/70 text-white p-1 rounded'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
              </svg>
            </div>
          )}
          {video.price && video.price > 0 && (
            <span className='absolute top-2 left-2 z-30 px-2 py-0.5 bg-accent text-white text-xs font-semibold rounded'>
              {new Intl.NumberFormat('vi-VN').format(video.price)}đ
            </span>
          )}
        </div>
        <div className='p-4 flex flex-col flex-grow min-h-[80px]'>
          <h3 className='font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-accent transition-colors' style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {video.title}
          </h3>
          <div className='mt-auto flex items-center justify-between text-sm text-foreground/60'>
            <span>{video.views?.toLocaleString() || 0} lượt xem</span>
            <span>{video.createdAt && formatDate(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
