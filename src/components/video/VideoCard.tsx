'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import HoverThumbnail from '@/components/common/HoverThumbnail';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import type { VideoResponse } from '@/lib/apis/video.api';

interface VideoCardProps {
  video: VideoResponse;
  onEdit: (video: VideoResponse) => void;
  onDelete: (videoId: string) => void;
  onRestore?: (videoId: string) => void;
  isDeleted?: boolean;
  showUserInfo?: boolean;
  allowViewWhenDeleted?: boolean;
  showActions?: boolean;
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    UPLOADING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    READY: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    DELETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };

  const labels: Record<string, string> = {
    UPLOADING: 'Đang upload',
    PROCESSING: 'Đang xử lý',
    READY: 'Sẵn sàng',
    FAILED: 'Thất bại',
    DELETED: 'Đã xóa',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${badges[status]}`}>
      {labels[status]}
    </span>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return 'vừa xong';
  } else if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} tuần trước`;
  } else if (diffMonths < 12) {
    return `${diffMonths} tháng trước`;
  } else {
    return `${diffYears} năm trước`;
  }
};

const VideoCard = memo(function VideoCard({ 
  video, 
  onEdit, 
  onDelete, 
  onRestore, 
  isDeleted, 
  showUserInfo = false,
  allowViewWhenDeleted = false,
  showActions = true 
}: VideoCardProps) {
  const { isDark } = useDarkMode();
  const handleEdit = () => onEdit(video);
  const handleDelete = () => onDelete(video.id);
  const handleRestore = () => onRestore?.(video.id);

  return (
    <div className={`rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full flex flex-col ${
      isDark ? 'bg-gray-800 shadow-black/50' : 'bg-white shadow-lg shadow-gray-200/50'
    } ${isDeleted ? 'opacity-75' : ''}`}>
      <div className='relative w-full pb-[56.25%] flex-shrink-0'>
        <div className='absolute inset-0'>
          {isDeleted && !allowViewWhenDeleted ? (
            <div className='block cursor-not-allowed w-full h-full'>
              <HoverThumbnail
                thumbnailUrl={video.thumbnailUrl}
                splashImageUrl={video.splashImageUrl}
                alt={video.title}
                title={video.title}
                className='w-full h-full grayscale'
              />
              <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-20'>
                <span className='text-white text-lg font-medium'>Đã xóa</span>
              </div>
            </div>
          ) : (
            <Link href={`/watch/${video.id}`} className='block w-full h-full'>
              <HoverThumbnail
                thumbnailUrl={video.thumbnailUrl}
                splashImageUrl={video.splashImageUrl}
                alt={video.title}
                title={video.title}
                className='w-full h-full'
              />
              {video.duration > 0 && (
                <span className='absolute bottom-2 right-2 z-30 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded'>
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </span>
              )}
              <div className='absolute top-2 right-2 z-30 flex items-center gap-2'>
                {!video.isPublic && (
                  <div className='bg-black/70 text-white p-1 rounded'>
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                    </svg>
                  </div>
                )}
                {getStatusBadge(video.status)}
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className='p-4 flex flex-col flex-grow min-h-[120px]'>
        <Link href={`/watch/${video.id}`} className='block group/link'>
          <h3 className='font-semibold text-foreground line-clamp-2 mb-2 group-hover/link:text-accent transition-colors' style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {video.title}
          </h3>
        </Link>

        {showUserInfo && video.userFullName && (
          <div className='flex items-center gap-2 mb-2 p-2 bg-accent/10 rounded-lg'>
            <div className='w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-white'>
              {video.userFullName.charAt(0).toUpperCase()}
            </div>
            <span className='text-sm text-foreground font-medium'>
              {video.userFullName}
            </span>
          </div>
        )}

        <div className='flex items-center justify-between text-sm text-foreground/60 mb-auto'>
          <span>{video.views?.toLocaleString() || 0} lượt xem</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>

        {showActions && (
        <div className='flex gap-2 mt-3'>
          {isDeleted ? (
            <button
              onClick={handleRestore}
              className='flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer'
            >
              Khôi phục
            </button>
          ) : (
            <>
              <button
                className='flex-1 text-center bg-accent hover:bg-accent/90 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer'
                onClick={handleEdit}
              >
                Chỉnh sửa
              </button>
              
              <button
                onClick={handleDelete}
                className='bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer'
              >
                Xóa
              </button>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
});

export default VideoCard;
