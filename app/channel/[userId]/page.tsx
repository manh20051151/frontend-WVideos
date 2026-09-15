'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VideoCard from '@/components/video/VideoCard';
import { userApi, type UserProfileResponse } from '@/lib/apis/user.api';
import { subscriptionApi } from '@/lib/apis/subscription.api';
import { useAuth } from '@/lib/hooks/useAuth';
import ClientOnly from '@/components/common/ClientOnly';
import { ChannelNotificationBell } from '@/components/channel';
import type { VideoResponse, PageResponse } from '@/types';

export default function ChannelPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [videoPage, setVideoPage] = useState(0);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await userApi.getUserProfile(userId);
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
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
    if (loadingVideos) return;
    setLoadingVideos(true);
    try {
      const data = await userApi.getVideos(userId, { page: pageToLoad, size: 12 }) as unknown as PageResponse<VideoResponse>;
      setVideos((prev) => (pageToLoad === 0 ? data.content : [...prev, ...data.content]));
      setHasMoreVideos(pageToLoad + 1 < data.totalPages);
      setVideoPage(pageToLoad);
    } catch (err) {
      console.error('Lỗi tải video kênh:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setVideos([]);
      setVideoPage(0);
      setHasMoreVideos(true);
      fetchChannelVideos(0);
    }
  }, [userId]);
  
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
      console.error('Subscription error:', err);
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
                
                <p className="text-sm text-foreground/60 mb-4">{profile.email}</p>
                
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
              <button className="py-4 border-b-2 border-red-600 text-red-600 font-medium">
                Video
              </button>
            </nav>
          </div>
          
          {/* Video Grid */}
          {videos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                {videos.map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onEdit={() => {}}
                    onDelete={() => {}}
                    showActions={false}
                  />
                ))}
              </div>

              {loadingVideos && (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
                </div>
              )}

              {hasMoreVideos && !loadingVideos && (
                <div className="flex justify-center pb-12">
                  <button
                    onClick={() => fetchChannelVideos(videoPage + 1)}
                    className="px-6 py-2 rounded-full bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
                  >
                    Xem thêm
                  </button>
                </div>
              )}
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
        </div>
        
        <Footer />
      </div>
    </ClientOnly>
  );
}