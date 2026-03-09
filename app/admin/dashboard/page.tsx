'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { dashboardApi, DashboardStats } from '@/lib/apis/dashboard.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import TopCategoriesCard from '@/components/admin/TopCategoriesCard';
import TopUsersCard from '@/components/admin/TopUsersCard';
import VideoStatusChart from '@/components/admin/VideoStatusChart';
import ClientOnly from '@/components/common/ClientOnly';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check admin permission
  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.some(role => role.name === 'ADMIN'))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load dashboard stats
  useEffect(() => {
    if (user && user.roles?.some(role => role.name === 'ADMIN')) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardApi.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải thống kê dashboard');
    } finally {
      setLoading(false);
    }
  };

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
                  🎛️ Dashboard Admin
                </h1>
                <p className='mt-2 text-foreground opacity-70'>
                  Tổng quan hệ thống và thống kê chi tiết
                </p>
              </div>
              <button
                onClick={loadDashboardStats}
                disabled={loading}
                className='btn-accent font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50'
              >
                {loading ? '🔄 Đang tải...' : '🔄 Làm mới'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
              <p className='text-red-600'>{error}</p>
              <button
                onClick={loadDashboardStats}
                className='mt-2 text-red-700 hover:text-red-800 font-medium'
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && !stats ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='bg-secondary rounded-xl p-6 border border-accent animate-pulse'>
                  <div className='h-4 bg-accent opacity-30 rounded w-3/4 mb-2'></div>
                  <div className='h-8 bg-accent opacity-30 rounded w-1/2 mb-2'></div>
                  <div className='h-3 bg-accent opacity-30 rounded w-2/3'></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Overview Stats */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                <StatCard
                  title='Tổng người dùng'
                  value={stats.totalUsers}
                  icon='👥'
                  color='primary'
                />
                <StatCard
                  title='Tổng video'
                  value={stats.totalVideos}
                  icon='📹'
                  color='accent'
                />
                <StatCard
                  title='Tổng thể loại'
                  value={stats.totalCategories}
                  icon='📂'
                  color='highlight'
                />
                <StatCard
                  title='Tổng lượt xem'
                  value={stats.totalViews}
                  icon='👁️'
                  color='secondary'
                />
              </div>

              {/* Charts and Analytics */}
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8'>
                {/* Daily Stats Charts */}
                <ChartCard
                  title='📈 Người dùng mới (7 ngày)'
                  data={stats.dailyStats}
                  type='users'
                />
                <ChartCard
                  title='📊 Video mới (7 ngày)'
                  data={stats.dailyStats}
                  type='videos'
                />
                <ChartCard
                  title='👁️ Lượt xem (7 ngày)'
                  data={stats.dailyStats}
                  type='views'
                />
              </div>

              {/* Status and Rankings */}
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                {/* Video Status */}
                <VideoStatusChart
                  uploading={stats.videosUploading}
                  processing={stats.videosProcessing}
                  ready={stats.videosReady}
                  failed={stats.videosFailed}
                />

                {/* Top Categories */}
                <TopCategoriesCard categories={stats.topCategories} />

                {/* Top Users */}
                <TopUsersCard users={stats.topUsers} />
              </div>
            </>
          ) : null}

          {/* Quick Actions */}
          <div className='mt-8 bg-secondary rounded-xl p-6 border border-accent'>
            <h3 className='text-lg font-semibold text-foreground mb-4'>
              ⚡ Thao tác nhanh
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <button
                onClick={() => router.push('/admin/categories')}
                className='flex items-center space-x-2 p-3 bg-primary rounded-lg border border-accent hover:bg-accent hover:bg-opacity-20 transition-colors'
              >
                <span className='text-xl'>📂</span>
                <span className='font-medium text-foreground'>Quản lý thể loại</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className='flex items-center space-x-2 p-3 bg-primary rounded-lg border border-accent hover:bg-accent hover:bg-opacity-20 transition-colors'
              >
                <span className='text-xl'>👥</span>
                <span className='font-medium text-foreground'>Quản lý người dùng</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/videos')}
                className='flex items-center space-x-2 p-3 bg-primary rounded-lg border border-accent hover:bg-accent hover:bg-opacity-20 transition-colors'
              >
                <span className='text-xl'>📹</span>
                <span className='font-medium text-foreground'>Quản lý video</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/settings')}
                className='flex items-center space-x-2 p-3 bg-primary rounded-lg border border-accent hover:bg-accent hover:bg-opacity-20 transition-colors'
              >
                <span className='text-xl'>⚙️</span>
                <span className='font-medium text-foreground'>Cài đặt hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}