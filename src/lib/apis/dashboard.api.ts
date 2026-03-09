import axiosClient from './axiosClient';

// Types cho Dashboard Stats
export interface DashboardStats {
  // Thống kê tổng quan
  totalUsers: number;
  totalVideos: number;
  totalCategories: number;
  totalViews: number;
  
  // Thống kê video theo trạng thái
  videosUploading: number;
  videosProcessing: number;
  videosReady: number;
  videosFailed: number;
  
  // Thống kê theo thời gian
  dailyStats: DailyStats[];
  
  // Top categories và users
  topCategories: CategoryStats[];
  topUsers: UserStats[];
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  newUsers: number;
  newVideos: number;
  totalViews: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  videoCount: number;
  totalViews: number;
}

export interface UserStats {
  userId: string;
  username: string;
  email: string;
  videoCount: number;
  totalViews: number;
  joinDate: string;
}

// API functions
export const dashboardApi = {
  // Lấy thống kê dashboard (admin only)
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axiosClient.get('/admin/dashboard/stats');
    return response.result || response;
  },
};