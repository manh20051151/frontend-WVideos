'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import videoApi, { VideoResponse } from '@/lib/apis/video.api';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import ClientOnly from '@/components/common/ClientOnly';
import HoverThumbnail from '@/components/common/HoverThumbnail';
import EditVideoModal from '@/components/video/EditVideoModal';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function MyVideosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingVideo, setEditingVideo] = useState<VideoResponse | null>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await videoApi.getMyVideos(page, 12);
      console.log('📹 Videos response:', response);
      console.log('📹 First video:', response.content[0]);
      
      // Debug thumbnail URLs
      response.content.forEach((video, index) => {
        console.log(`🖼️ Video ${index + 1} (${video.title}):`, {
          id: video.id,
          thumbnailUrl: video.thumbnailUrl,
          splashImageUrl: video.splashImageUrl,
          status: video.status
        });
      });
      
      setVideos(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication
  useEffect(() => {
    // Chỉ redirect khi đã load xong và không có user
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      fetchVideos();
    }
  }, [page, user]);

  // Early return AFTER all hooks - wrap trong ClientOnly
  if (!user) {
    return (
      <ClientOnly fallback={
        <>
          <Header />
          <div className='min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-7xl mx-auto'>
              <div className='animate-pulse'>
                <div className='h-8 bg-secondary rounded w-64 mb-4'></div>
                <div className='h-4 bg-secondary rounded w-96 mb-8'></div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className='bg-secondary rounded-lg overflow-hidden shadow'>
                      <div className='w-full h-48 bg-accent opacity-30' />
                      <div className='p-4 space-y-3'>
                        <div className='h-4 bg-accent opacity-30 rounded w-3/4' />
                        <div className='h-3 bg-accent opacity-30 rounded w-1/2' />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </>
      }>
        {null}
      </ClientOnly>
    );
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('Bạn có chắc muốn xóa video này?')) return;

    try {
      await videoApi.deleteVideo(videoId);
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Xóa video thất bại');
    }
  };

  const handleEditVideo = (video: VideoResponse) => {
    setEditingVideo(video);
  };

  const handleSaveVideo = async (videoId: string, data: { title: string; description: string; isPublic: boolean }) => {
    try {
      const updatedVideo = await videoApi.updateVideo(videoId, data);
      
      // Cập nhật video trong danh sách
      setVideos(prevVideos => 
        prevVideos.map(video => 
          video.id === videoId ? updatedVideo : video
        )
      );
      
      setEditingVideo(null);
      alert('Cập nhật video thành công!');
    } catch (error) {
      console.error('Error updating video:', error);
      throw error; // Re-throw để EditVideoModal xử lý
    }
  };

  const handleCloseEditModal = () => {
    setEditingVideo(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      UPLOADING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      READY: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      DELETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };

    const labels = {
      UPLOADING: 'Đang upload',
      PROCESSING: 'Đang xử lý',
      READY: 'Sẵn sàng',
      FAILED: 'Thất bại',
      DELETED: 'Đã xóa',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
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

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>� Video của tôi</h1>
              <p className='mt-2 text-foreground opacity-70'>
                Quản lý tất cả video bạn đã upload
              </p>
            </div>
            <Link
              href='/upload'
              className='btn-accent font-medium py-2 px-6 rounded-lg transition-colors'
            >
              + Upload Video
            </Link>
          </div>

          {/* Loading */}
          {loading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[...Array(6)].map((_, i) => (
                <div key={i} className='bg-secondary rounded-lg overflow-hidden shadow animate-pulse'>
                  <div className='w-full h-48 bg-accent opacity-30' />
                  <div className='p-4 space-y-3'>
                    <div className='h-4 bg-accent opacity-30 rounded w-3/4' />
                    <div className='h-3 bg-accent opacity-30 rounded w-1/2' />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            /* Empty State */
            <div className='text-center py-12'>
              <svg
                className='mx-auto h-24 w-24 text-accent'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                />
              </svg>
              <h3 className='mt-4 text-lg font-medium text-foreground'>
                Chưa có video nào
              </h3>
              <p className='mt-2 text-foreground opacity-70'>
                Bắt đầu bằng cách upload video đầu tiên của bạn
              </p>
              <Link
                href='/upload'
                className='mt-6 inline-block btn-accent font-medium py-2 px-6 rounded-lg transition-colors'
              >
                Upload Video
              </Link>
            </div>
          ) : (
            /* Video Grid */
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className='bg-secondary rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow border border-accent border-opacity-20'
                  >
                    {/* Thumbnail với Hover Splash Image */}
                    <Link href={`/watch/${video.id}`} className='block relative'>
                      <HoverThumbnail
                        thumbnailUrl={video.thumbnailUrl}
                        splashImageUrl={video.splashImageUrl}
                        alt={video.title}
                        title={video.title}
                        className='w-full h-48'
                        onError={() => console.log('❌ Thumbnail failed for:', video.id)}
                        onLoad={() => console.log('✅ Thumbnail loaded for:', video.id)}
                      />
                      
                      <div className='absolute top-2 right-2'>
                        {getStatusBadge(video.status)}
                      </div>

                      {/* Play button overlay */}
                      <div className='absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30'>
                        <div className='bg-white bg-opacity-90 rounded-full p-3'>
                          <svg className='w-8 h-8 text-gray-800' fill='currentColor' viewBox='0 0 24 24'>
                            <path d='M8 5v14l11-7z'/>
                          </svg>
                        </div>
                      </div>
                    </Link>

                    {/* Info */}
                    <div className='p-4'>
                      <Link href={`/watch/${video.id}`} className='block hover:text-accent transition-colors'>
                        <h3 className='font-semibold text-foreground line-clamp-2 mb-2'>
                          {video.title}
                        </h3>
                      </Link>
                      
                      <div className='flex items-center text-sm text-foreground opacity-70 space-x-4 mb-3'>
                        <span>👁️ {video.views} lượt xem</span>
                        <span>{video.isPublic ? '🌐 Công khai' : '🔒 Riêng tư'}</span>
                      </div>
                      <p className='text-xs text-foreground opacity-50 mb-4'>
                        {formatDate(video.createdAt)}
                      </p>

                      {/* Actions */}
                      <div className='flex gap-2'>
                        <Link
                          href={`/watch/${video.id}`}
                          className='flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors'
                        >
                          ▶️ Xem
                        </Link>
                        
                        <button
                          className='flex-1 text-center btn-accent text-sm font-medium py-2 px-4 rounded transition-colors'
                          onClick={() => handleEditVideo(video)}
                        >
                          ✏️ Chỉnh sửa
                        </button>
                        
                        <button
                          onClick={() => handleDelete(video.id)}
                          className='bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors'
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-8 flex justify-center gap-2'>
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className='px-4 py-2 border border-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors text-foreground'
                  >
                    Trước
                  </button>
                  <span className='px-4 py-2 text-foreground'>
                    Trang {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className='px-4 py-2 border border-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors text-foreground'
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Video Modal */}
        <EditVideoModal
          isOpen={!!editingVideo}
          onClose={handleCloseEditModal}
          video={editingVideo}
          onSave={handleSaveVideo}
        />
      </div>
      <Footer />
    </>
  );
}