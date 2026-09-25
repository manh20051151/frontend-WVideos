'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VideoCard from '@/components/video/VideoCard';
import Pagination from '@/components/common/Pagination';
import videoApi from '@/lib/apis/video.api';
import { userApi, type UserProfileResponse } from '@/lib/apis/user.api';
import { subscriptionApi } from '@/lib/apis/subscription.api';
import { useAuth } from '@/lib/hooks/useAuth';
import ClientOnly from '@/components/common/ClientOnly';
import { ChannelNotificationBell } from '@/components/channel';
import type { VideoResponse, PageResponse } from '@/types';

const PAGE_SIZE = 12;

type ChannelTab = 'videos' | 'liked';

export default function ChannelView() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [videoPage, setVideoPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Tab "Video đã thích" của kênh
  const [activeTab, setActiveTab] = useState<ChannelTab>('videos');
  const [likedVideos, setLikedVideos] = useState<VideoResponse[]>([]);
  const [likedPage, setLikedPage] = useState(0);
  const [likedTotalPages, setLikedTotalPages] = useState(0);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [likedLoaded, setLikedLoaded] = useState(false);

  // Ref tới đầu lưới video để cuộn mượt khi đổi trang
  const gridTopRef = useRef<HTMLDivElement>(null);
  // Trang ban đầu từ URL ?page= (1-based như trang chủ), chỉ đọc 1 lần
  const initialPageRef = useRef(Math.max(1, parseInt(searchParams.get('page') || '1', 10)) - 1);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await userApi.getUserProfile(userId);
        setProfile(data);
      } catch (err: any) {
        setError('Không thể tải thông tin kênh');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchChannelVideos = async (pageToLoad: number) => {
    setLoadingVideos(true);
    try {
      const data = await userApi.getVideos(userId, { page: pageToLoad, size: PAGE_SIZE }) as unknown as PageResponse<VideoResponse>;

      // Deep-link vào số trang vượt quá tổng số trang: nạp về trang cuối hợp lệ
      if (data.totalPages > 0 && pageToLoad > data.totalPages - 1) {
        fetchChannelVideos(data.totalPages - 1);
        return;
      }

      setVideos(data.content);
      setTotalPages(data.totalPages);
      setVideoPage(pageToLoad);
    } catch (err) {
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setVideos([]);
      setVideoPage(0);
      // Reset tab đã thích khi đổi kênh
      setActiveTab('videos');
      setLikedVideos([]);
      setLikedPage(0);
      setLikedTotalPages(0);
      setLikedLoaded(false);
      fetchChannelVideos(initialPageRef.current);
    }
  }, [userId]);

  // Đồng bộ số trang lên URL ?page=N (giống trang chủ) để share/lưu lại được
  useEffect(() => {
    const urlParams = new URLSearchParams();
    if (videoPage > 0) urlParams.set('page', String(videoPage + 1));

    const queryString = urlParams.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(url, { scroll: false });
  }, [videoPage, pathname, router]);

  const goToPage = (p: number) => {
    const target = Math.max(0, Math.min(p, totalPages - 1));
    if (target === videoPage) return;
    fetchChannelVideos(target);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Tab "Video đã thích": nạp lần đầu khi bật tab, sau đó phân trang
  // Dùng profile.id (UUID thật) thay vì userId từ URL (có thể là slug)
  const fetchLikedVideos = async (pageToLoad: number) => {
    if (!profile?.id) return;
    setLoadingLiked(true);
    try {
      const data = await videoApi.getPublicLikedVideos(profile.id, pageToLoad, PAGE_SIZE);

      if (data.totalPages > 0 && pageToLoad > data.totalPages - 1) {
        fetchLikedVideos(data.totalPages - 1);
        return;
      }

      setLikedVideos(data.content);
      setLikedTotalPages(data.totalPages);
      setLikedPage(pageToLoad);
      setLikedLoaded(true);
    } catch (err) {
      setLikedLoaded(true);
    } finally {
      setLoadingLiked(false);
    }
  };

  const handleTabChange = (tab: ChannelTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    if (tab === 'liked' && !likedLoaded) {
      fetchLikedVideos(0);
    }
  };

  const goToLikedPage = (p: number) => {
    const target = Math.max(0, Math.min(p, likedTotalPages - 1));
    if (target === likedPage) return;
    fetchLikedVideos(target);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const handleSubscribe = async () => {
    if (!currentUser) return;
    
    try {
      setSubscribing(true);
      if (profile?.isSubscribed) {
        await subscriptionApi.unsubscribe(userId);
        setProfile(prev => prev ? { ...prev, isSubscribed: false, subscriberCount: prev.subscriberCount - 1 } : null);
      } else {
        await subscriptionApi.subscribe(userId);
        setProfile(prev => prev ? { ...prev, isSubscribed: true, subscriberCount: prev.subscriberCount + 1 } : null);
      }
    } catch (err) {
    } finally {
      setSubscribing(false);
    }
  };
  
  const formatViews = (views: number | null | undefined) => {
    const viewCount = views || 0;
    if (viewCount >= 1000000) {
      return `${(viewCount / 1000000).toFixed(1)}M`;
    }
    if (viewCount >= 1000) {
      return `${(viewCount / 1000).toFixed(1)}N`;
    }
    return viewCount.toString();
  };
  
  if (loading) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-primary">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    );
  }
  
  if (error || !profile) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-primary">
          <Header />
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-red-500">{error || 'Không tìm thấy kênh'}</p>
          </div>
        </div>
      </ClientOnly>
    );
  }
  
  const isOwnChannel = currentUser?.id === profile.id;
  
  return (
    <ClientOnly>
      <div className="min-h-screen bg-primary">
        <Header />
        
        {/* Cover & Profile Info */}
        <div className="bg-gradient-to-b from-accent/20 to-transparent">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                {profile.avatar && !avatarError ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.fullName}
                    className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-accent flex items-center justify-center text-white text-4xl font-bold">
                    {profile.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {profile.fullName || profile.email}
                </h1>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-foreground/70 mb-4">
                  <span>{profile.subscriberCount.toLocaleString('vi-VN')} người đăng ký</span>
                  <span>{profile.videoCount.toLocaleString('vi-VN')} video</span>
                  <span>{formatViews(profile.totalViews)} lượt xem</span>
                </div>
                
                {/* Subscribe Button */}
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <ChannelNotificationBell
                    channelId={profile.id}
                    channelName={profile.fullName || profile.email}
                    isSubscribed={!!profile.isSubscribed}
                  />

                  {!isOwnChannel && currentUser && (
                    <button 
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className={`px-8 py-2 rounded-full font-medium transition-colors ${
                        profile.isSubscribed 
                          ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {subscribing ? 'Đang xử lý...' : (profile.isSubscribed ? 'Đã đăng ký' : 'Đăng ký')}
                    </button>
                  )}

                  {!currentUser && (
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { tab: 'register' } }))}
                      className="inline-block px-8 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                    >
                      Đăng ký
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="container mx-auto px-4">
          <div className="border-b border-accent/20 mb-6">
            <nav className="flex gap-8">
              <button
                onClick={() => handleTabChange('videos')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'videos'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                Video
              </button>
              <button
                onClick={() => handleTabChange('liked')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'liked'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                Video đã thích
              </button>
            </nav>
          </div>

          {/* Tab: Video của kênh */}
          {activeTab === 'videos' && (
            <>
              {videos.length > 0 ? (
                <>
                  <div ref={gridTopRef} className='scroll-mt-20' />

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8 transition-opacity duration-200 ${
                      loadingVideos ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    {videos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        showActions={false}
                        showStatus={false}
                      />
                    ))}
                  </div>

                  <Pagination
                    currentPage={videoPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    className='pb-8'
                  />
                </>
              ) : !loadingVideos ? (
                <div className="text-center py-12 text-foreground/60">
                  <p className="text-lg">Chưa có video nào</p>
                  {isOwnChannel && (
                    <Link
                      href="/upload"
                      className="inline-block mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
                    >
                      Tải video lên
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
                </div>
              )}
            </>
          )}

          {/* Tab: Video đã thích của kênh */}
          {activeTab === 'liked' && (
            <>
              {likedVideos.length > 0 ? (
                <>
                  <div ref={gridTopRef} className='scroll-mt-20' />

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8 transition-opacity duration-200 ${
                      loadingLiked ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    {likedVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        showActions={false}
                        showStatus={false}
                      />
                    ))}
                  </div>

                  <Pagination
                    currentPage={likedPage}
                    totalPages={likedTotalPages}
                    onPageChange={goToLikedPage}
                    className='pb-8'
                  />
                </>
              ) : !loadingLiked ? (
                <div className="text-center py-12 text-foreground/60">
                  <p className="text-lg">Kênh này chưa thích video công khai nào</p>
                </div>
              ) : (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
                </div>
              )}
            </>
          )}
        </div>
        
        <Footer />
      </div>
    </ClientOnly>
  );
}
