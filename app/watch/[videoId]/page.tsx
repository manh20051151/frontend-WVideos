'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import videoApi, { type VideoResponse } from '@/lib/apis/video.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientOnly from '@/components/common/ClientOnly';

export default function WatchVideoPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;
  
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const videoData = await videoApi.getVideoById(videoId);
        setVideo(videoData);
        
        // Tăng lượt xem
        await videoApi.incrementViews(videoId);
      } catch (error) {
        console.error('Error fetching video:', error);
        setError('Không thể tải video');
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  if (loading) {
    return (
      <ClientOnly fallback={
        <>
          <Header />
          <div className='min-h-screen bg-primary py-12 px-4'>
            <div className='max-w-6xl mx-auto'>
              <div className='animate-pulse'>
                <div className='w-full h-96 bg-secondary rounded-lg mb-6'></div>
                <div className='h-8 bg-secondary rounded w-3/4 mb-4'></div>
                <div className='h-4 bg-secondary rounded w-1/2'></div>
              </div>
            </div>
          </div>
          <Footer />
        </>
      }>
        <div className='min-h-screen bg-primary flex items-center justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-accent'></div>
        </div>
      </ClientOnly>
    );
  }

  if (error || !video) {
    return (
      <>
        <Header />
        <div className='min-h-screen bg-primary py-12 px-4'>
          <div className='max-w-6xl mx-auto text-center'>
            <div className='bg-secondary rounded-lg p-8'>
              <h1 className='text-2xl font-bold text-foreground mb-4'>
                {error || 'Video không tồn tại'}
              </h1>
              <p className='text-foreground opacity-70 mb-6'>
                Video này có thể đã bị xóa hoặc không công khai
              </p>
              <Link
                href='/'
                className='btn-accent font-medium py-2 px-6 rounded-lg transition-colors'
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4'>
        <div className='max-w-6xl mx-auto'>
          {/* Video Player */}
          <div className='bg-secondary rounded-lg overflow-hidden shadow-lg mb-6'>
            <div className='relative aspect-video'  style={{marginTop: '-94px',marginBottom: '0px'}}>
              {video.downloadUrl ? (
                <iframe
                  width='100%'
                  height='100%'
                  src={video.downloadUrl}
                  scrolling='no'
                  frameBorder='0'
                  allowFullScreen={true}
                  title={video.title}
                  // className='w-full h-full'
                  style={{marginLeft: '-28px', width: '105%',height: '111%'}}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-white'>
                  <div className='text-center'>
                    <svg className='w-16 h-16 mx-auto mb-4 opacity-50' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M8 5v14l11-7z'/>
                    </svg>
                    <p className='text-lg'>Video đang được xử lý</p>
                    <p className='text-sm opacity-70'>Vui lòng thử lại sau</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Video Info */}
            <div className='lg:col-span-2'>
              <div className='bg-secondary rounded-lg p-6 shadow'>
                <h1 className='text-2xl font-bold text-foreground mb-4'>
                  {video.title}
                </h1>
                
                <div className='flex flex-wrap items-center gap-4 text-sm text-foreground opacity-70 mb-4'>
                  <span>👁️ {video.views} lượt xem</span>
                  <span>📅 {formatDate(video.createdAt)}</span>
                  {video.duration && (
                    <span>⏱️ {formatDuration(video.duration)}</span>
                  )}
                  {video.fileSize && (
                    <span>💾 {formatFileSize(video.fileSize)}</span>
                  )}
                </div>

                <div className='flex items-center gap-2 mb-6'>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    video.status === 'READY' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {video.status === 'READY' ? '✅ Sẵn sàng' : '⏳ Đang xử lý'}
                  </span>
                  
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    video.isPublic 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {video.isPublic ? '🌐 Công khai' : '🔒 Riêng tư'}
                  </span>
                </div>

                {video.description && (
                  <div className='border-t border-accent border-opacity-20 pt-4'>
                    <h3 className='font-semibold text-foreground mb-2'>Mô tả</h3>
                    <p className='text-foreground opacity-80 whitespace-pre-wrap'>
                      {video.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Thumbnail */}
              <div className='bg-secondary rounded-lg p-4 shadow'>
                <h3 className='font-semibold text-foreground mb-3'>Hình ảnh</h3>
                <div className='space-y-3'>
                  {video.thumbnailUrl && (
                    <div>
                      <p className='text-sm text-foreground opacity-70 mb-1'>Thumbnail</p>
                      <img
                        src={video.thumbnailUrl}
                        alt='Thumbnail'
                        className='w-full rounded border border-accent border-opacity-20'
                      />
                    </div>
                  )}
                  {video.splashImageUrl && (
                    <div>
                      <p className='text-sm text-foreground opacity-70 mb-1'>Splash Image</p>
                      <img
                        src={video.splashImageUrl}
                        alt='Splash'
                        className='w-full rounded border border-accent border-opacity-20'
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className='bg-secondary rounded-lg p-4 shadow'>
                <h3 className='font-semibold text-foreground mb-3'>Hành động</h3>
                <div className='space-y-2'>
                  <Link
                    href='/my-videos'
                    className='block w-full text-center btn-accent font-medium py-2 px-4 rounded transition-colors'
                  >
                    📋 Video của tôi
                  </Link>
                  
                  {video.downloadUrl && (
                    <a
                      href={video.downloadUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors'
                    >
                      📥 Tải xuống
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}