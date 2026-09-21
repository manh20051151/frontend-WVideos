'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/apis/auth.api';
import videoApi, { VideoResponse } from '@/lib/apis/video.api';
import { uploadImageToImgbb } from '@/lib/utils/imgbb';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VideoCard from '@/components/video/VideoCard';
import VideoCardLite from '@/components/video/VideoCardLite';
import Pagination from '@/components/common/Pagination';
import { subscriptionApi } from '@/lib/apis/subscription.api';
import notificationApi from '@/lib/apis/notification.api';
import NotificationMenu from '@/components/notification/NotificationMenu';
import FinanceTab from '@/components/profile/FinanceTab';
import AnalyticsTab from '@/components/profile/AnalyticsTab';
import ReportsTab from '@/components/profile/ReportsTab';
import type { AppNotification } from '@/lib/hooks/useNotifications';
import Link from 'next/link';

const formatNotifTime = (iso?: string): string => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
};

const MENU_ITEMS = [
  { id: 'personal', label: 'Thông tin cá nhân', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'my-videos', label: 'Video của tôi', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { id: 'analytics', label: 'Thống kê kênh', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'liked', label: 'Video đã thích', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'purchased', label: 'Video đã mua', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'reports', label: 'Báo cáo của tôi', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5a1 1 0 011 1v6.5h2a2 2 0 012-2h2.5a1 1 0 011 1v6.5a1 1 0 01-1 1h-8.586a1 1 0 00-.707.293l-2.707 2.707H3z' },
  { id: 'finance', label: 'Tài chính', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'channels', label: 'Kênh đã đăng ký', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z' },
  { id: 'notifications', label: 'Thông báo', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { id: 'password', label: 'Đổi mật khẩu', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

const formatCurrency = (value?: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value ?? 0);
};

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { isDark } = useDarkMode();

  const [selectedMenu, setSelectedMenu] = useState<string>('personal');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<{ fullName: string; numberPhone: string; avatar: string; gender: boolean | null; bankName: string; bankAccountHolderName: string; bankAccountNumber: string }>({
    fullName: '',
    numberPhone: '',
    avatar: '',
    gender: null,
    bankName: '',
    bankAccountHolderName: '',
    bankAccountNumber: '',
  });
  const [passwordData, setPasswordData] = useState<{ passwordOld: string; passwordNew: string; confirmPassword: string }>({
    passwordOld: '',
    passwordNew: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState<{ old: boolean; new: boolean; confirm: boolean }>({
    old: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const [banks, setBanks] = useState<Array<{ code: string; name: string; shortName: string; logo: string }>>([]);
  const [bankSearch, setBankSearch] = useState<string>('');
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [myVideosPage, setMyVideosPage] = useState<number>(0);
  const MY_VIDEOS_PAGE_SIZE = 20;

  const { data: myVideosData, isLoading: myVideosLoading, refetch: refetchMyVideos } = useQuery({
    queryKey: ['myVideos', myVideosPage],
    queryFn: () => videoApi.getMyVideos(myVideosPage, MY_VIDEOS_PAGE_SIZE),
    enabled: selectedMenu === 'my-videos',
  });

  const myVideosTotalPages = myVideosData?.totalPages ?? 0;

  const [likedVideosPage, setLikedVideosPage] = useState<number>(0);
  const LIKED_VIDEOS_PAGE_SIZE = 12;

  const { data: likedVideosData, isLoading: likedVideosLoading } = useQuery({
    queryKey: ['likedVideos', likedVideosPage],
    queryFn: () => videoApi.getLikedVideos(likedVideosPage, LIKED_VIDEOS_PAGE_SIZE),
    enabled: selectedMenu === 'liked',
  });

  const likedVideosTotalPages = likedVideosData?.totalPages ?? 0;

  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['myChannels'],
    queryFn: () => subscriptionApi.getMyChannels(),
    enabled: selectedMenu === 'channels',
  });

  const [purchasedPage, setPurchasedPage] = useState<number>(0);
  const PURCHASED_PAGE_SIZE = 12;

  const { data: purchasedData, isLoading: purchasedLoading } = useQuery({
    queryKey: ['purchasedVideos', purchasedPage],
    queryFn: () => videoApi.getPurchasedVideos(purchasedPage, PURCHASED_PAGE_SIZE),
    enabled: selectedMenu === 'purchased',
  });

  const purchasedTotalPages = purchasedData?.totalPages ?? 0;

  const [notifPage, setNotifPage] = useState<number>(0);
  const NOTIF_PAGE_SIZE = 15;
  const [notifItems, setNotifItems] = useState<AppNotification[]>([]);
  const [notifTotalPages, setNotifTotalPages] = useState<number>(0);
  const [menuOpenNotifId, setMenuOpenNotifId] = useState<string | null>(null);

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications-page', notifPage],
    queryFn: () => notificationApi.getNotifications(notifPage, NOTIF_PAGE_SIZE),
    enabled: selectedMenu === 'notifications',
  });

  useEffect(() => {
    if (notifData) {
      setNotifItems(notifData.content ?? []);
      setNotifTotalPages(notifData.totalPages ?? 0);
    }
  }, [notifData]);


  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && MENU_ITEMS.find(item => item.id === tab)) {
      setSelectedMenu(tab);
      const pageParam = searchParams.get('page');
      const page = pageParam ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
      if (tab === 'my-videos') {
        setMyVideosPage(page);
      } else if (tab === 'liked') {
        setLikedVideosPage(page);
      } else if (tab === 'purchased') {
        setPurchasedPage(page);
      } else if (tab === 'notifications') {
        setNotifPage(page);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        numberPhone: user.numberPhone || '',
        avatar: user.avatar || '',
        gender: user.gender ?? null,
        bankName: user.bankName || '',
        bankAccountHolderName: user.bankAccountHolderName || '',
        bankAccountNumber: user.bankAccountNumber || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await authApi.getBankList();
        if (response.code === '00' && response.data) {
          setBanks(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách ngân hàng:', error);
      }
    };
    fetchBanks();
  }, []);

  const handleMenuClick = useCallback((menuId: string) => {
    setSelectedMenu(menuId);
    setMyVideosPage(0);
    setLikedVideosPage(0);
    setPurchasedPage(0);
    setNotifPage(0);
    router.push(`/profile?tab=${menuId}`);
    setError('');
    setSuccess('');
    setIsEditing(false);
  }, [router]);

  const goToMyVideosPage = useCallback((page: number) => {
    setMyVideosPage(page);
    router.push(`/profile?tab=my-videos&page=${page}`);
  }, [router]);

  const goToLikedVideosPage = useCallback((page: number) => {
    setLikedVideosPage(page);
    router.push(`/profile?tab=liked&page=${page}`);
  }, [router]);

  const goToPurchasedPage = useCallback((page: number) => {
    setPurchasedPage(page);
    router.push(`/profile?tab=purchased&page=${page}`);
  }, [router]);

  const goToNotifPage = useCallback((page: number) => {
    setNotifPage(page);
    router.push(`/profile?tab=notifications&page=${page}`);
  }, [router]);

  const handleNotifClick = useCallback(async (n: AppNotification) => {
    if (!n.read) {
      setNotifItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try { await notificationApi.markAsRead(n.id); } catch { /* ignore */ }
    }
    const isVideoType = n.type === 'NEW_VIDEO' || n.type === 'COMMENT' || n.type === 'PURCHASE' || n.type === 'LIKE';
    if (isVideoType && n.relatedId) {
      router.push(`/watch/${n.videoSlug || n.relatedId}`);
    }
  }, [router]);

  const handleNotifHide = useCallback(async (n: AppNotification) => {
    setNotifItems((prev) => prev.filter((x) => x.id !== n.id));
    try { await notificationApi.hideNotification(n.id); } catch { /* ignore */ }
  }, []);

  const handleNotifMuteChannel = useCallback((n: AppNotification) => {
    if (n.actorId) subscriptionApi.muteChannel(n.actorId).catch(() => { /* ignore */ });
  }, []);

  const handleNotifMuteAll = useCallback(async (n: AppNotification) => {
    if (!n.actorId) return;
    subscriptionApi.muteChannel(n.actorId).catch(() => { /* ignore */ });
    setNotifItems((prev) => prev.filter((x) => x.actorId !== n.actorId));
    try { await notificationApi.hideAllFromActor(n.actorId); } catch { /* ignore */ }
  }, []);

  const handleNotifMarkAllRead = useCallback(async () => {
    setNotifItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try { await notificationApi.markAllAsRead(); } catch { /* ignore */ }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (selectedMenu === 'password') {
      setPasswordData((prev: { passwordOld: string; passwordNew: string; confirmPassword: string }) => ({ ...prev, [name]: value }));
    } else {
      if (name === 'gender') {
        setFormData((prev) => ({ ...prev, gender: value === 'true' ? true : value === 'false' ? false : null }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
    setError('');
    setSuccess('');
  }, [selectedMenu]);

  const handleGenderChange = useCallback((value: boolean | null) => {
    setFormData(prev => ({ ...prev, gender: value }));
    setError('');
    setSuccess('');
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!formData.fullName.trim()) {
      setError('Họ tên không được để trống');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await authApi.updateProfile({
        fullName: formData.fullName,
        numberPhone: formData.numberPhone,
        avatar: formData.avatar,
        gender: formData.gender ?? undefined,
        bankName: formData.bankName || undefined,
        bankAccountHolderName: formData.bankAccountHolderName || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
      });
      await refreshProfile();
      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cập nhật thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [formData, refreshProfile]);

  const handleAvatarChange = useCallback(async (file: File) => {
    setAvatarUploading(true);
    setError('');
    setSuccess('');
    try {
      const result = await uploadImageToImgbb(file);
      if (!result.success || !result.data?.url) {
        setError(result.error || 'Upload ảnh thất bại');
        return;
      }
      const avatarUrl = result.data.url;
      await authApi.updateProfile({ avatar: avatarUrl });
      setFormData(prev => ({ ...prev, avatar: avatarUrl }));
      await refreshProfile();
      setSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cập nhật ảnh thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setAvatarUploading(false);
    }
  }, [refreshProfile]);

  const handleSavePassword = useCallback(async () => {
    if (!passwordData.passwordOld) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (passwordData.passwordNew.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordData.passwordNew !== passwordData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await authApi.changePassword({
        passwordOld: passwordData.passwordOld,
        passwordNew: passwordData.passwordNew,
      });
      setSuccess('Đổi mật khẩu thành công!');
      setPasswordData({ passwordOld: '', passwordNew: '', confirmPassword: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [passwordData]);

  const handleCancel = useCallback(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        numberPhone: user.numberPhone || '',
        avatar: user.avatar || '',
        gender: user.gender ?? null,
        bankName: user.bankName || '',
        bankAccountHolderName: user.bankAccountHolderName || '',
        bankAccountNumber: user.bankAccountNumber || '',
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  }, [user]);

  // Video edit handlers
  const handleEditVideo = useCallback((video: VideoResponse) => {
    router.push(`/edit/${video.id}`);
  }, [router]);

  // Video delete handlers
  const handleDeleteVideo = useCallback((videoId: string) => {
    setDeletingVideoId(videoId);
    setDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingVideoId) return;
    setError('');
    setSuccess('');
    try {
      await videoApi.deleteVideo(deletingVideoId);
      await refetchMyVideos();
      setSuccess('Xóa video thành công!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xóa video thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setDeletingVideoId(null);
      setDeleteConfirm(false);
    }
  }, [deletingVideoId, refetchMyVideos]);

  const handleCancelDelete = useCallback(() => {
    setDeletingVideoId(null);
    setDeleteConfirm(false);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="animate-pulse max-w-2xl mx-auto py-12 px-4">
          <div className="h-32 bg-secondary rounded-full w-32 mx-auto mb-6"></div>
          <div className="h-8 bg-secondary rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-secondary rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  const deleteModal = deleteConfirm && deletingVideoId ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleCancelDelete} />
      <div className={`relative rounded-2xl shadow-2xl w-full max-w-md mx-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold text-foreground">Xác nhận xóa video</h3>
        </div>
        <div className="p-6">
          <p className={`text-foreground/80 mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelDelete}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-200 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-primary">
      {deleteModal}
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12 w-full">
        <div className="w-full">
          {/* Mobile: menu chip cuộn ngang */}
          <div className="lg:hidden mb-5 -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedMenu === item.id
                      ? 'bg-accent text-white shadow-md shadow-accent/25'
                      : 'bg-secondary text-foreground/70 border border-accent/25 hover:text-foreground hover:bg-primary'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: card thông tin user compact */}
          <div className="lg:hidden mb-6">
            <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-4 flex items-center gap-3">
                {formData.avatar && !avatarError ? (
                  <img src={formData.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-accent flex-shrink-0" onError={() => setAvatarError(true)} />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{user.fullName || user.email}</h3>
                  <p className="text-sm text-foreground opacity-60 truncate">{user.email}</p>
                </div>
              </div>
              <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                <div className={`rounded-xl p-2.5 text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-[11px] text-foreground opacity-60">Số dư</p>
                  <p className="text-sm font-semibold text-green-600 truncate">{formatCurrency(user.balance)}</p>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-[11px] text-foreground opacity-60">Doanh thu</p>
                  <p className="text-sm font-semibold text-foreground truncate">{formatCurrency(user.revenue)}</p>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-[11px] text-foreground opacity-60">Đăng ký</p>
                  <p className="text-sm font-semibold text-foreground">{(user.subscriberCount ?? 0).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Sidebar - chỉ hiển thị trên desktop */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
              {/* User Info Card */}
              <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-6 text-center border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="relative inline-block">
                    {formData.avatar && !avatarError ? (
                      <img src={formData.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-accent mx-auto" onError={() => setAvatarError(true)} />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold mx-auto">
                        {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{user.fullName || user.email}</h3>
                  <p className="text-sm text-foreground opacity-60">{user.email}</p>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center py-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Số dư</span>
                    <span className="font-semibold text-green-600">{formatCurrency(user.balance)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Doanh thu</span>
                    <span className="font-semibold text-foreground">{formatCurrency(user.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Người đăng ký</span>
                    <span className="font-semibold text-foreground">
                      {(user.subscriberCount ?? 0).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Card */}
              <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="p-4">
                  <nav className="space-y-1">
                    {MENU_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                          selectedMenu === item.id ? 'bg-accent text-white' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <h4 className="font-semibold text-foreground">Thống kê nhanh</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Video đã tải lên</span>
                    <span className="font-semibold text-foreground">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Lượt xem</span>
                    <span className="font-semibold text-foreground">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-4">
              <div className={`rounded-2xl shadow-lg border overflow-visible ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-foreground">
                      {MENU_ITEMS.find(m => m.id === selectedMenu)?.label}
                    </h1>
                    {selectedMenu === 'personal' && !isEditing && (
                      <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent/80 transition-colors">
                        Chỉnh sửa
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {selectedMenu === 'personal' && (
                    <div className="space-y-6">
                      <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="relative group">
                            <label className="relative block cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleAvatarChange(file);
                                  e.target.value = '';
                                }}
                                className="hidden"
                                disabled={avatarUploading}
                              />
                              {formData.avatar && !avatarError ? (
                                <img src={formData.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-accent" onError={() => setAvatarError(true)} />
                              ) : (
                                <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-white text-3xl font-bold">
                                  {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                {avatarUploading ? (
                                  <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                                )}
                              </div>
                            </label>
                            {!avatarUploading && (
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-foreground opacity-0 group-hover:opacity-60 transition-opacity whitespace-nowrap">
                                Đổi ảnh
                              </span>
                            )}
                          </div>
                          <div className="text-center sm:text-left flex-1">
                            <h3 className="text-lg font-semibold text-foreground">{user.fullName || 'Chưa cập nhật'}</h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                          <input type="email" value={user.email || ''} disabled
                            className={`w-full px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Họ tên <span className="text-red-500">*</span></label>
                          <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={!isEditing}
                            className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''} ${error && !formData.fullName ? 'border-red-500' : ''}`} />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Số điện thoại</label>
                          <input type="text" name="numberPhone" value={formData.numberPhone} onChange={handleInputChange} disabled={!isEditing}
                            className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''}`} />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Giới tính</label>
                          {isEditing ? (
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" checked={formData.gender === true} onChange={() => handleGenderChange(true)}
                                  className="w-4 h-4 text-accent" />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Nam</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" checked={formData.gender === false} onChange={() => handleGenderChange(false)}
                                  className="w-4 h-4 text-accent" />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Nữ</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" checked={formData.gender === null} onChange={() => handleGenderChange(null)}
                                  className="w-4 h-4 text-accent" />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Khác</span>
                              </label>
                            </div>
                          ) : (
                            <input type="text" value={user.gender === true ? 'Nam' : user.gender === false ? 'Nữ' : 'Khác'} disabled
                              className={`w-full px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
                          )}
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ngày tham gia</label>
                          <input type="text" value={user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('vi-VN') : 'Chưa rõ'} disabled
                            className={`w-full px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ngân hàng</label>
                          {isEditing ? (
                            <div className="relative">
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                  {formData.bankName && banks.find(b => b.code === formData.bankName)?.logo ? (
                                    <img
                                      src={banks.find(b => b.code === formData.bankName)?.logo}
                                      alt="Bank logo"
                                      className="w-6 h-6 object-contain"
                                    />
                                  ) : (
                                    <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={formData.bankName ? banks.find(b => b.code === formData.bankName)?.shortName + ' - ' + banks.find(b => b.code === formData.bankName)?.name : bankSearch}
                                  onChange={(e) => {
                                    setBankSearch(e.target.value);
                                    const dropdown = document.getElementById('bank-dropdown');
                                    if (!dropdown || dropdown.classList.contains('hidden')) {
                                      dropdown?.classList.remove('hidden');
                                    }
                                  }}
                                  onFocus={() => document.getElementById('bank-dropdown')?.classList.remove('hidden')}
                                  placeholder="Tìm kiếm ngân hàng..."
                                  className={`w-full pl-10 pr-10 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-700'}`}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                  <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              <div id="bank-dropdown" className={`hidden absolute z-50 w-full mt-1 rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                                <div className="max-h-64 overflow-auto">
                                  {banks
                                    .filter(bank => !bankSearch || bank.name.toLowerCase().includes(bankSearch.toLowerCase()) || bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()))
                                    .map((bank) => (
                                      <button
                                        key={bank.code}
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, bankName: bank.code }));
                                          setBankSearch('');
                                          document.getElementById('bank-dropdown')?.classList.add('hidden');
                                        }}
                                        className={`w-full px-4 py-3 flex items-center gap-3 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-700'} ${formData.bankName === bank.code ? 'bg-accent/10' : ''}`}
                                      >
                                        <img src={bank.logo} alt={bank.shortName} className="w-10 h-10 object-contain" />
                                        <span className="text-sm">{bank.shortName} - {bank.name}</span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {user.bankName && banks.find(b => b.code === user.bankName)?.logo && (
                                <img
                                  src={banks.find(b => b.code === user.bankName)?.logo}
                                  alt="Bank logo"
                                  className="w-8 h-8 object-contain rounded"
                                />
                              )}
                              <input
                                type="text"
                                value={banks.find(b => b.code === user.bankName)?.name || user.bankName || 'Chưa cập nhật'}
                                disabled
                                className={`flex-1 px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tên chủ tài khoản</label>
                          <input type="text" name="bankAccountHolderName" value={formData.bankAccountHolderName} onChange={handleInputChange} disabled={!isEditing} placeholder="Tên chủ tài khoản"
                            className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''}`} />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Số tài khoản</label>
                          <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleInputChange} disabled={!isEditing} placeholder="Số tài khoản"
                            className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''}`} />
                        </div>
                      </div>

                      {error && <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">{error}</div>}
                      {success && <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">{success}</div>}

                      {isEditing && (
                        <div className="flex gap-3 pt-4">
                          <button onClick={handleCancel} disabled={isSaving}
                            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} disabled:opacity-50`}>
                            Hủy
                          </button>
                          <button onClick={handleSaveProfile} disabled={isSaving}
                            className="flex-1 px-6 py-3 rounded-lg font-medium bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50">
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedMenu === 'password' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mật khẩu hiện tại</label>
                        <div className="relative">
                          <input 
                            type={showPassword.old ? 'text' : 'password'} 
                            name="passwordOld" 
                            value={passwordData.passwordOld} 
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            className={`w-full px-4 py-3 pr-10 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, old: !prev.old }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {showPassword.old ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.414 5.135m-5.613-5.613L19.07 19.07" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mật khẩu mới</label>
                        <div className="relative">
                          <input 
                            type={showPassword.new ? 'text' : 'password'} 
                            name="passwordNew" 
                            value={passwordData.passwordNew} 
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu mới"
                            className={`w-full px-4 py-3 pr-10 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {showPassword.new ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.414 5.135m-5.613-5.613L19.07 19.07" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Xác nhận mật khẩu mới</label>
                        <div className="relative">
                          <input 
                            type={showPassword.confirm ? 'text' : 'password'} 
                            name="confirmPassword" 
                            value={passwordData.confirmPassword} 
                            onChange={handleInputChange}
                            placeholder="Nhập lại mật khẩu mới"
                            className={`w-full px-4 py-3 pr-10 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {showPassword.confirm ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.414 5.135m-5.613-5.613L19.07 19.07" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        {error && <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">{error}</div>}
                        {success && <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">{success}</div>}
                      </div>
                      <div className="md:col-span-2">
                        <button onClick={handleSavePassword} disabled={isSaving}
                          className="w-full px-6 py-3 rounded-lg font-medium bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50">
                          {isSaving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedMenu === 'finance' && <FinanceTab isDark={isDark} />}

                  {selectedMenu === 'analytics' && <AnalyticsTab isDark={isDark} />}

                  {selectedMenu === 'my-videos' && (
                    <div>
                      {myVideosLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="aspect-video bg-gray-300 rounded-lg mb-2"></div>
                              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      ) : myVideosData?.content && myVideosData.content.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {myVideosData.content.map((video: VideoResponse) => (
                            <div key={video.id} className="min-w-0">
                              <VideoCard
                                video={video}
                                onEdit={handleEditVideo}
                                onDelete={handleDeleteVideo}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-lg font-medium">Chưa có video nào</p>
                          <p className="mt-1">Tải lên video đầu tiên của bạn ngay!</p>
                        </div>
                      )}

                      {myVideosTotalPages > 1 && (
                        <Pagination
                          currentPage={myVideosPage}
                          totalPages={myVideosTotalPages}
                          onPageChange={goToMyVideosPage}
                        />
                      )}
                    </div>
                  )}

                  {selectedMenu === 'liked' && (
                    <div>
                      {likedVideosLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="aspect-video bg-gray-300 rounded-lg mb-2"></div>
                              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      ) : likedVideosData?.content && likedVideosData.content.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {likedVideosData.content.map((video: VideoResponse) => (
                            <VideoCardLite key={video.id} video={video} />
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <p className="text-lg font-medium">Chưa có video yêu thích</p>
                          <p className="mt-1">Những video bạn thích sẽ xuất hiện ở đây!</p>
                        </div>
                      )}

                      {likedVideosTotalPages > 1 && (
                        <Pagination
                          currentPage={likedVideosPage}
                          totalPages={likedVideosTotalPages}
                          onPageChange={goToLikedVideosPage}
                        />
                      )}
                    </div>
                  )}

                  {selectedMenu === 'purchased' && (
                    <div>
                      {purchasedLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="aspect-video bg-gray-300 rounded-lg mb-2"></div>
                              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      ) : purchasedData?.content && purchasedData.content.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {purchasedData.content.map((video: VideoResponse) => (
                            <VideoCardLite key={video.id} video={video} />
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <p className="text-lg font-medium">Chưa mua video nào</p>
                          <p className="mt-1">Các video có phí bạn đã mua sẽ xuất hiện ở đây!</p>
                        </div>
                      )}

                      {purchasedTotalPages > 1 && (
                        <Pagination
                          currentPage={purchasedPage}
                          totalPages={purchasedTotalPages}
                          onPageChange={goToPurchasedPage}
                        />
                      )}
                    </div>
                  )}

                  {selectedMenu === 'reports' && (
                    <ReportsTab />
                  )}

                  {selectedMenu === 'channels' && (
                    <div>
                      {channelsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-3 p-4 rounded-xl">
                              <div className="w-14 h-14 rounded-full bg-gray-300"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : channelsData && channelsData.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {channelsData.map((channel) => (
                            <Link
                              key={channel.id}
                              href={`/channel/${channel.slug || channel.id}`}
                              className={`flex items-center gap-3 p-4 rounded-xl transition-all hover:-translate-y-0.5 ${
                                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl'
                              }`}
                            >
                              {channel.avatar ? (
                                <img src={channel.avatar} alt={channel.fullName} className="w-14 h-14 rounded-full object-cover border-2 border-accent" />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold">
                                  {channel.fullName?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{channel.fullName || channel.email}</p>
                                <p className="text-sm text-foreground/60">
                                  {(channel.subscriberCount ?? 0).toLocaleString('vi-VN')} người đăng ký
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z" />
                          </svg>
                          <p className="text-lg font-medium">Chưa đăng ký kênh nào</p>
                          <p className="mt-1">Hãy khám phá và đăng ký các kênh bạn yêu thích!</p>
                        </div>
                      )}
    </div>
                  )}

                  {selectedMenu === 'notifications' && (
                    <div>
                      <div className='flex justify-between items-center mb-4'>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {notifItems.filter((n) => !n.read).length} chưa đọc
                        </p>
                        {notifItems.some((n) => !n.read) && (
                          <button onClick={handleNotifMarkAllRead} className='text-sm text-accent hover:underline'>
                            Đánh dấu tất cả đã đọc
                          </button>
                        )}
                      </div>

                      {notifLoading ? (
                        <div className='space-y-2'>
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className='animate-pulse h-20 rounded-xl bg-secondary' />
                          ))}
                        </div>
                      ) : notifItems.length > 0 ? (
                        <ul className='space-y-2'>
                          {notifItems.map((n) => (
                            <li
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors border ${
                                n.read
                                  ? isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                  : isDark ? 'bg-gray-800 border-accent/40' : 'bg-accent/5 border-accent/30'
                              } hover:bg-secondary/50`}
                            >
                              <NotificationMenu
                                n={n}
                                open={menuOpenNotifId === n.id}
                                onToggle={() => setMenuOpenNotifId(menuOpenNotifId === n.id ? null : n.id)}
                                onClose={() => setMenuOpenNotifId(null)}
                                onHide={handleNotifHide}
                                onMuteChannel={handleNotifMuteChannel}
                                onMuteAll={handleNotifMuteAll}
                              />
                              {n.avatarUrl ? (
                                <img src={n.avatarUrl} alt='' className='w-10 h-10 rounded-full object-cover bg-secondary shrink-0' />
                              ) : (
                                <span className='w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground shrink-0'>
                                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                                  </svg>
                                </span>
                              )}
                              <div className='min-w-0 flex-1'>
                                <p className={`text-sm leading-snug line-clamp-2 ${n.read ? 'text-gray-500' : 'text-foreground font-medium'}`}>
                                  {n.content}
                                </p>
                                <p className='text-xs text-gray-500 mt-1'>{formatNotifTime(n.createdAt)}</p>
                              </div>
                              {n.thumbnailUrl && (
                                <img src={n.thumbnailUrl} alt='' className='w-[100px] h-[56px] rounded-lg object-cover bg-secondary shrink-0' />
                              )}
                              {!n.read && <span className='self-center w-2 h-2 rounded-full bg-[#065fd4] shrink-0' />}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className='w-16 h-16 mx-auto mb-4 opacity-50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                          </svg>
                          <p className='text-lg font-medium'>Chưa có thông báo nào</p>
                        </div>
                      )}

                      {notifTotalPages > 1 && (
                        <Pagination currentPage={notifPage} totalPages={notifTotalPages} onPageChange={goToNotifPage} />
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function ProfileLoading() {
  const { isDark } = useDarkMode();
  return (
    <div className="min-h-screen bg-primary">
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-40 lg:py-12 w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="animate-pulse">
                  <div className="h-20 w-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-48 mx-auto"></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="animate-pulse h-8 bg-gray-300 rounded w-48 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-300 rounded"></div>
                  <div className="h-12 bg-gray-300 rounded"></div>
                  <div className="h-12 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<ProfileLoading />}>
        <ProfileContent />
      </Suspense>
      <Footer />
    </>
  );
}
