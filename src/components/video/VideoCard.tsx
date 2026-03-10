'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import HoverThumbnail from '@/components/common/HoverThumbnail';
import type { VideoResponse } from '@/lib/apis/video.api';

interface VideoCardProps {
  video: VideoResponse;
  onEdit: (video: VideoResponse) => void;
  onDelete: (videoId: string) => void;
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
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
      {labels[status]}
    </span>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Memoized component để tránh re-render không cần thiết
const VideoCard = memo(function VideoCard({ video, onEdit, onDelete }: VideoCardProps) {
  const handleEdit = () => onEdit(video);
  const handleDelete = () => onDelete(video.id);

  return (
    <div className='bg-secondary rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow border border-accent border-opacity-20'>
      {/* Thumbnail */}
      <div className='relative'>
        <Link href={`/watch/${video.id}`} className='block cursor-pointer'>
          <HoverThumbnail
            thumbnailUrl={video.thumbnailUrl}
            splashImageUrl={video.splashImageUrl}
            alt={video.title}
            title={video.title}
            className='w-full h-48'
          />
          
          <div className='absolute top-2 right-2 z-20'>
            {getStatusBadge(video.status)}
          </div>

          {/* Play button overlay */}
          <div className='absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity'>
            <div className='bg-black bg-opacity-50 rounded-full p-3'>
              <svg className='w-8 h-8 text-white' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M8 5v14l11-7z'/>
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Info */}
      <div className='p-4'>
        <Link href={`/watch/${video.id}`} className='block hover:text-accent transition-colors'>
          <h3 className='font-semibold text-foreground line-clamp-2 mb-2'>
            {video.title}
          </h3>
        </Link>
        
        {/* Categories */}
        {video.categories && video.categories.length > 0 && (
          <div className='mb-2 flex flex-wrap gap-1'>
            {video.categories.map((category) => (
              <span 
                key={category.id}
                className='inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-accent text-foreground'
                style={{ 
                  backgroundColor: category.color ? `${category.color}20` : undefined,
                  borderColor: category.color || undefined 
                }}
              >
                {category.icon} {category.name}
              </span>
            ))}
          </div>
        )}
        
        <div className='flex items-center text-sm text-foreground opacity-70 space-x-4 mb-3'>
          <span>👁️ {video.views} lượt xem</span>
          <span>{video.isPublic ? '🌐 Công khai' : '🔒 Riêng tư'}</span>
        </div>
        <p className='text-xs text-foreground opacity-50 mb-4'>
          {formatDate(video.createdAt)}
        </p>

        {/* Actions */}
        <div className='flex gap-2'>
          <button
            className='flex-1 text-center btn-accent text-sm font-medium py-2 px-4 rounded transition-colors cursor-pointer'
            onClick={handleEdit}
          >
            ✏️ Chỉnh sửa
          </button>
          
          <button
            onClick={handleDelete}
            className='bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors cursor-pointer'
          >
            🗑️ Xóa
          </button>
        </div>
      </div>
    </div>
  );
});

export default VideoCard;
