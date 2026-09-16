import axiosClient from './axiosClient';

// ===== Thống kê kênh của chính người dùng =====
export interface DailyPoint {
  date: string; // yyyy-MM-dd
  count: number;
}

export interface TopVideoStat {
  id: string;
  title: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt?: string;
}

export interface ChannelAnalytics {
  videoCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFavorites: number;
  subscriberCount: number;
  newSubscribers30d: number;
  viewsToday: number;
  views7d: number;
  views30d: number;
  viewTrend: DailyPoint[];
  subscriberTrend: DailyPoint[];
  statusBreakdown: Record<string, number>;
  topVideos: TopVideoStat[];
}

export const analyticsApi = {
  getMyChannelAnalytics: (): Promise<ChannelAnalytics> => {
    return axiosClient.get('videos/my-channel-analytics');
  },
};
