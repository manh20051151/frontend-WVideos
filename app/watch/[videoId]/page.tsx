'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import videoApi, { type VideoResponse } from '@/lib/apis/video.api';
import { subscriptionApi } from '@/lib/apis/subscription.api';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientOnly from '@/components/common/ClientOnly';
import AuthModal from '@/components/auth/AuthModal';
import CommentSection from '@/components/video/CommentSection';
import RelatedVideosSection from '@/components/video/RelatedVideosSection';

export default function WatchVideoPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const { user: currentUser } = useAuth();
  
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [subscribing, setSubscribing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<'LIKE' | 'DISLIKE' | null>(null);
  const [reacting, setReacting] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const videoData = await videoApi.getVideoById(videoId);
        setVideo(videoData);
        
        // Set subscription info từ video response
        if (videoData.subscriberCount !== undefined) {
          setSubscriberCount(videoData.subscriberCount);
        }
        if (videoData.isSubscribed !== undefined) {
          setIsSubscribed(videoData.isSubscribed);
        }
        // Set reaction info
        if (videoData.likeCount !== undefined) {
          setLikeCount(videoData.likeCount);
        }
        if (videoData.dislikeCount !== undefined) {
          setDislikeCount(videoData.dislikeCount);
        }
        if (videoData.userReaction !== undefined) {
          setUserReaction(videoData.userReaction);
        }
      } catch (error: any) {
        console.error('Error fetching video:', error);
        console.log('Error response:', error?.response?.data);
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          // Luôn hiện modal đăng nhập cho video riêng tư
          setShowLoginModal(true);
        } else {
          setError('Không thể tải video');
        }
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  useEffect(() => {
    if (video && video.status === 'READY') {
      const timer = setTimeout(async () => {
        try {
          await videoApi.incrementViews(videoId);
        } catch (error) {
          console.error('Lỗi khi tăng lượt xem:', error);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [video, videoId]);

  // Với Streamtape: lấy direct mp4 URL để phát trực tiếp qua <video> (fallback iframe nếu fail)
  useEffect(() => {
    let cancelled = false;
    if (video && video.status === 'READY' && video.embedUrl.includes('streamtape.com')) {
      videoApi.getStreamtapeStreamUrl(video.embedUrl)
        .then((url) => {
          if (!cancelled && url) {
            setStreamUrl(url);
          }
        })
        .catch((e) => console.error('❌ Lỗi lấy direct URL Streamtape:', e));
    }
    return () => { cancelled = true; };
  }, [video]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Đã sao chép link!');
  };

  const handleSubscribe = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      setSubscribing(true);
      if (isSubscribed) {
        await subscriptionApi.unsubscribe(video.userId);
        setIsSubscribed(false);
        setSubscriberCount(prev => prev - 1);
      } else {
        await subscriptionApi.subscribe(video.userId);
        setIsSubscribed(true);
        setSubscriberCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setSubscribing(false);
    }
  };

  const handleReaction = async (reactionType: 'LIKE' | 'DISLIKE') => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Không cho phép tự react video của mình
    if (currentUser.id === video?.userId) {
      return;
    }

    try {
      setReacting(true);
      const response = await videoApi.toggleReaction(video.id, reactionType);
      setLikeCount(response.likeCount);
      setDislikeCount(response.dislikeCount);
      setUserReaction(response.userReaction);
    } catch (error) {
      console.error('Reaction error:', error);
    } finally {
      setReacting(false);
    }
  };

  if (loading) {
    return (
      <ClientOnly fallback={
        <>
          <Header />
          <div className='min-h-screen bg-primary py-12 px-4'>
            <div className='max-w-6xl mx-auto'>
              <div className='animate-pulse'>
                <div className='w-full h-[500px] bg-secondary rounded-lg mb-6'></div>
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

  // Login Modal for private videos - ƯU TIÊN HƠN
  if (showLoginModal) {
    return (
      <>
        <Header />
        <div className='min-h-screen bg-primary py-12 px-4'>
          <div className='max-w-md mx-auto text-center'>
            <div className='bg-secondary rounded-lg p-8'>
              <div className='w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center'>
                <svg className='w-8 h-8 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                </svg>
              </div>
              <h2 className='text-xl font-bold text-foreground mb-2'>
                Video riêng tư
              </h2>
              <p className='text-foreground opacity-70 mb-6'>
                Đây là video riêng tư. Bạn cần đăng nhập để xem video này.
              </p>
              <div className='flex gap-3 justify-center'>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className='btn-accent font-medium py-2 px-6 rounded-lg transition-colors'
                >
                  Đăng nhập / Đăng ký
                </button>
                <Link
                  href='/'
                  className='bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium py-2 px-6 rounded-lg transition-colors text-foreground'
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => {
            setShowAuthModal(false);
          }}
          onLoginSuccess={() => {
            setShowAuthModal(false);
            setShowLoginModal(false);
            window.location.reload();
          }} 
        />
      </>
    );
  }

  if (error || !video) {
    return (
      <>
        <Header />
        <div className='min-h-screen bg-primary py-12 px-4'>
          <div className='max-w-md mx-auto text-center'>
            <div className='bg-secondary rounded-lg p-8'>
              <div className='w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center'>
                <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h1 className='text-xl font-bold text-foreground mb-2'>
                Video không tồn tại
              </h1>
              <p className='text-foreground opacity-70 mb-6'>
                Video này có thể đã bị xóa hoặc không tồn tại
              </p>
              <div className='flex gap-3 justify-center'>
                <Link
                  href='/'
                  className='btn-accent font-medium py-2 px-6 rounded-lg transition-colors'
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Chặn truy cập nếu video chưa sẵn sàng (chưa READY)
  if (video && video.status !== 'READY') {
    const isFailed = video.status === 'FAILED';
    return (
      <>
        <Header />
        <div className='min-h-screen bg-primary flex items-center justify-center px-4'>
          <div className='max-w-md w-full text-center'>
            <div className='bg-secondary rounded-lg p-8'>
              <div className='w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center'>
                <svg className='w-8 h-8 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h1 className='text-xl font-bold text-foreground mb-2'>
                {isFailed ? 'Video xử lý thất bại' : 'Video đang được xử lý'}
              </h1>
              <p className='text-foreground opacity-70 mb-6'>
                {isFailed
                  ? 'Video này xử lý không thành công. Vui lòng thử upload lại.'
                  : 'Video của bạn đang được tải lên và chuyển đổi. Vui lòng quay lại sau ít phút.'}
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

  const descriptionPreview = video.description && video.description.length > 200 
    ? video.description.slice(0, 200) + '...' 
    : video.description;

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary'>
        <div className='px-40 py-6'>
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            {/* Left Column - Video + Info */}
            <div className='lg:col-span-4 space-y-4'>
              {/* Video Player */}
              <div className='bg-black rounded-lg overflow-hidden'>
                <div className='relative aspect-video'>
                  {streamUrl ? (
                    <video
                      src={streamUrl}
                      className='w-full h-full'
                      controls
                      playsInline
                      poster={video.splashImageUrl || video.thumbnailUrl || undefined}
                      title={video.title}
                      onError={() => setStreamUrl(null)}
                    />
                  ) : video.embedUrl ? (
                    <iframe
                      src={video.embedUrl}
                      className='w-full h-full'
                      allowFullScreen
                      allow='autoplay; encrypted-media; picture-in-picture; fullscreen'
                      frameBorder='0'
                      title={video.title}
                    />
                  ) : video.status === 'READY' ? (
                    <div className='w-full h-full flex items-center justify-center text-white'>
                      <div className='text-center'>
                        <svg className='w-16 h-16 mx-auto mb-4 opacity-50' fill='currentColor' viewBox='0 0 24 24'>
                          <path d='M8 5v14l11-7z'/>
                        </svg>
                        <p className='text-lg'>Không có nguồn video</p>
                      </div>
                    </div>
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-white'>
                      <div className='text-center'>
                        <svg className='w-16 h-16 mx-auto mb-4 opacity-50' fill='currentColor' viewBox='0 0 24 24'>
                          <path d='M8 5v14l11-7z'/>
                        </svg>
                        <p className='text-lg'>Video đang được xử lý</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Title */}
              <h1 className='text-xl font-bold text-foreground'>
                {video.title}
              </h1>

              {/* Action Bar */}
              <div className='flex items-center justify-between border-b border-accent border-opacity-20 pb-4'>
                <div className='text-foreground opacity-70'>
                  <span>{formatViews(video.views)}</span>
                  <span className='mx-2'>•</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
                
                <div className='flex items-center gap-2'>
                  <button 
                    onClick={() => handleReaction('LIKE')}
                    disabled={reacting || (currentUser?.id === video.userId)}
                    title={currentUser?.id === video.userId ? 'Không thể tự thích video của mình' : ''}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full hover:bg-secondary transition-colors ${
                      currentUser?.id === video.userId ? 'opacity-50 cursor-not-allowed' :
                      userReaction === 'LIKE' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-foreground'
                    }`}
                  >
                    <svg className='w-6 h-6' fill={userReaction === 'LIKE' ? 'currentColor' : 'none'} stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5' />
                    </svg>
                    <span className='font-medium'>{likeCount.toLocaleString('vi-VN')}</span>
                  </button>

                  <button 
                    onClick={() => handleReaction('DISLIKE')}
                    disabled={reacting || (currentUser?.id === video.userId)}
                    title={currentUser?.id === video.userId ? 'Không thể tự dislike video của mình' : ''}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full hover:bg-secondary transition-colors ${
                      currentUser?.id === video.userId ? 'opacity-50 cursor-not-allowed' :
                      userReaction === 'DISLIKE' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-foreground'
                    }`}
                  >
                    <svg className='w-6 h-6' fill={userReaction === 'DISLIKE' ? 'currentColor' : 'none'} stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5' />
                    </svg>
                    <span className='font-medium'>{dislikeCount.toLocaleString('vi-VN')}</span>
                  </button>

                  <button 
                    onClick={copyLink}
                    className='flex items-center gap-2 px-4 py-2 rounded-full hover:bg-secondary transition-colors text-foreground'
                  >
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                    </svg>
                    <span className='font-medium'>Chia sẻ</span>
                  </button>

                  {video.downloadUrl && (
                    <a
                      href={video.downloadUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 px-4 py-2 rounded-full hover:bg-secondary transition-colors text-foreground'
                    >
                      <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                      </svg>
                      <span className='font-medium'>Tải xuống</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Channel Bar */}
              <div className='flex items-center justify-between py-4 border-b border-accent border-opacity-20'>
                <Link href={`/channel/${video.userId}`} className='flex items-center gap-4 hover:opacity-80 transition-opacity'>
                  <div className='w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold text-lg'>
                    {video.userFullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className='font-semibold text-foreground'>{video.userFullName}</h3>
                    <p className='text-sm text-foreground opacity-60'>
                      {subscriberCount > 0 
                        ? `${subscriberCount.toLocaleString('vi-VN')} người đăng ký`
                        : (currentUser && currentUser.id === video.userId ? 'Kênh của bạn' : 'Kênh')
                      }
                    </p>
                  </div>
                </Link>
                {currentUser && currentUser.id !== video.userId && (
                  <button 
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className={`font-medium py-2 px-6 rounded-full transition-colors ${
                      isSubscribed 
                        ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {subscribing ? 'Đang xử lý...' : (isSubscribed ? 'Đã đăng ký' : 'Đăng ký')}
                  </button>
                )}
                {currentUser && currentUser.id === video.userId && (
                  <button className='bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-full transition-colors'>
                    Kênh của bạn
                  </button>
                )}
                {!currentUser && (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className='bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-full transition-colors'
                  >
                    Đăng ký
                  </button>
                )}
              </div>

              {/* Description */}
              {video.description && (
                <div className='bg-secondary rounded-xl p-4'>
                  <div className='text-foreground'>
                    <p className='whitespace-pre-wrap'>
                      {showFullDescription ? video.description : descriptionPreview}
                    </p>
                    {video.description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className='text-blue-500 font-medium mt-2 hover:underline'
                      >
                        {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Categories & Tags */}
              {((video.categories?.length ?? 0) > 0 || (video.tags?.length ?? 0) > 0) && (
                <div className='flex flex-wrap gap-2'>
                  {video.categories?.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className='px-3 py-1 bg-secondary rounded-full text-sm text-foreground hover:bg-accent hover:text-white transition-colors'
                    >
                      {cat.name}
                    </Link>
                  ))}
                  {video.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-secondary rounded-full text-sm text-foreground opacity-70'
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments Section */}
              <div className='bg-secondary rounded-xl p-6'>
                <CommentSection videoId={videoId} />
              </div>
            </div>

            {/* Right Column - Related Videos */}
            <div className='space-y-4'>
              <h3 className='font-bold text-lg text-foreground'>Video liên quan</h3>

              {video && (
                <RelatedVideosSection currentVideoId={videoId} />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
