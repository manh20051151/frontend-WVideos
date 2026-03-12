'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import videoApi, { VideoResponse } from '@/lib/apis/video.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VideoCard from '@/components/video/VideoCard';
import ClientOnly from '@/components/common/ClientOnly';

export default function AdminTrashPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [deletedVideos, setDeletedVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Check admin permission
  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.some(role => role.name === 'ADMIN'))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load danh sách video đã xóa
  const loadDeletedVideos = useCallback(async (pageNum = 0) => {
    try {
      setLoading(true);
      const response = await videoApi.getDeletedVideos(pageNum, 12);
      setDeletedVideos(response.content || []);
      setTotalPages(response.totalPages || 0);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error loading deleted videos:', err);
      alert('Lỗi khi tải danh sách video đã xóa');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dữ liệu khi vào trang
  useEffect(() => {
    if (user && user.roles?.some(role => role.name === 'ADMIN')) {
      loadDeletedVideos(0);
    }
  }, [user, loadDeletedVideos]);

  // Khôi phục video
  const handleRestore = useCallback(async (videoId: string) => {
    if (!confirm('Bạn có chắc muốn khôi phục video này?')) return;

    try {
      await videoApi.restoreVideo(videoId);
      alert('Khôi phục video thành công!');
      loadDeletedVideos(page);
    } catch (err: any) {
      console.error('Error restoring video:', err);
      alert('Khôi phục video thất bại');
    }
  }, [page, loadDeletedVideos]);

  // Show loading or unauthorized
  if (!user || !user.roles?.some(role => role.name === 'ADMIN')) {
    return (
      <ClientOnly fallback={
        <>
          <Header />
          <div className='min-h-screen bg-primary flex items-center justify-center'>
            <div className='animate-pulse text-center'>
              <div className='w-16 h-16 bg-secondary rounded-full mx-auto mb-4'></div>
              <div className='h-4 bg-secondary rounded w-32 mx-auto'></div>
            </div>
          </div>
          <Footer />
        </>
      }>
        {null}
      </ClientOnly>
    );
  }

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-foreground'>
                  🗑️ Thùng rác video
                </h1>
                <p className='mt-2 text-foreground opacity-70'>
                  Quản lý các video đã bị xóa bởi người dùng
                </p>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className='btn-accent font-medium py-2 px-4 rounded-lg transition-colors'
                >
                  ← Quay lại Dashboard
                </button>
                <button
                  onClick={() => loadDeletedVideos(page)}
                  disabled={loading}
                  className='bg-secondary border border-accent font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-foreground'
                >
                  {loading ? '🔄 Đang tải...' : '🔄 Làm mới'}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
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
          ) : deletedVideos.length === 0 ? (
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
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
              <h3 className='mt-4 text-lg font-medium text-foreground'>Thùng rác trống</h3>
              <p className='mt-2 text-foreground opacity-70'>
                Không có video nào đã bị xóa
              </p>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {deletedVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onRestore={handleRestore}
                    isDeleted
                    showUserInfo
                    allowViewWhenDeleted
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-8 flex justify-center gap-2'>
                  <button
                    onClick={() => loadDeletedVideos(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className='px-4 py-2 border border-accent rounded-lg disabled:opacity-50 hover:bg-secondary transition-colors text-foreground'
                  >
                    Trước
                  </button>
                  <span className='px-4 py-2 text-foreground'>
                    Trang {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => loadDeletedVideos(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className='px-4 py-2 border border-accent rounded-lg disabled:opacity-50 hover:bg-secondary transition-colors text-foreground'
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
