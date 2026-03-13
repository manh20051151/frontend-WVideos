'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import videoApi, { VideoResponse } from '@/lib/apis/video.api';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import ClientOnly from '@/components/common/ClientOnly';
import VideoCard from '@/components/video/VideoCard';
import EditVideoModal from '@/components/video/EditVideoModal';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function MyVideosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [editingVideo, setEditingVideo] = useState<VideoResponse | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sử dụng React Query để caching và tối ưu performance
  const { data: videosData, isLoading: loading } = useQuery({
    queryKey: ['myVideos', page],
    queryFn: () => videoApi.getMyVideos(page, 12),
    enabled: !!user, // Chỉ fetch khi đã có user
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  const videos = videosData?.content || [];
  const totalPages = videosData?.totalPages || 0;

  // Định nghĩa TẤT CẢ hooks trước khi có bất kỳ early return nào
  const handleDeleteClick = useCallback((video: VideoResponse) => {
    setDeletingVideo(video);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingVideo) return;

    setIsDeleting(true);
    try {
      await videoApi.deleteVideo(deletingVideo.id);
      queryClient.invalidateQueries({ queryKey: ['myVideos'] });
      setDeletingVideo(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Xóa video thất bại');
    } finally {
      setIsDeleting(false);
    }
  }, [deletingVideo, queryClient]);

  const handleCancelDelete = useCallback(() => {
    setDeletingVideo(null);
  }, []);

  const handleEditVideo = useCallback((video: VideoResponse) => {
    setEditingVideo(video);
  }, []);

  const handleSaveVideo = useCallback(async (videoId: string, data: { title: string; description: string; isPublic: boolean; categoryIds: string[]; thumbnailUrl?: string | null }) => {
    try {
      await videoApi.updateVideo(videoId, {
        title: data.title,
        description: data.description,
        isPublic: data.isPublic,
        categoryIds: data.categoryIds
      });
      queryClient.invalidateQueries({ queryKey: ['myVideos'] });
      setEditingVideo(null);
      alert('Cập nhật video thành công!');
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }, [queryClient]);

  const handleCloseEditModal = useCallback(() => {
    setEditingVideo(null);
  }, []);

  // Early return SAU KHI đã định nghĩa tất cả hooks
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

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-foreground'> Video của tôi</h1>
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

          {/* Content - Danh sách video của tôi */}
          {loading || authLoading ? (
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
            <div className='text-center py-12'>
              <svg className='mx-auto h-24 w-24 text-accent' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
              </svg>
              <h3 className='mt-4 text-lg font-medium text-foreground'>Chưa có video nào</h3>
              <p className='mt-2 text-foreground opacity-70'>Bắt đầu bằng cách upload video đầu tiên của bạn</p>
              <Link href='/upload' className='mt-6 inline-block btn-accent font-medium py-2 px-6 rounded-lg transition-colors'>
                Upload Video
              </Link>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} onEdit={handleEditVideo} onDelete={() => handleDeleteClick(video)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className='mt-8 flex justify-center gap-2'>
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className='px-4 py-2 border border-accent rounded-lg disabled:opacity-50 hover:bg-secondary transition-colors text-foreground'>Trước</button>
                  <span className='px-4 py-2 text-foreground'>Trang {page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className='px-4 py-2 border border-accent rounded-lg disabled:opacity-50 hover:bg-secondary transition-colors text-foreground'>Sau</button>
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

        {/* Delete Confirmation Modal */}
        {deletingVideo && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-secondary rounded-xl p-6 max-w-md w-full border border-accent shadow-2xl'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
                  <svg className='w-6 h-6 text-red-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-foreground'>Xác nhận xóa</h3>
              </div>

              <p className='text-foreground opacity-80 mb-6'>
                Bạn có chắc muốn xóa video <strong className='text-foreground'>&quot;{deletingVideo.title}&quot;</strong>?<br />
                <span className='text-sm opacity-60'>Video sẽ được chuyển vào thùng rác và có thể khôi phục sau.</span>
              </p>

              <div className='flex gap-3 justify-end'>
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className='px-4 py-2 rounded-lg border border-accent text-foreground hover:bg-primary transition-colors disabled:opacity-50'
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className='px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2'
                >
                  {isDeleting ? (
                    <>
                      <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    <>🗑️ Xóa video</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}