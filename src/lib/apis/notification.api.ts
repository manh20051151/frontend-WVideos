import axiosClient from './axiosClient';

export interface AppNotification {
  id: string;
  type: 'COMMENT' | 'SUBSCRIBE' | 'PURCHASE' | 'LIKE' | 'NEW_VIDEO' | 'ANNOUNCEMENT';
  title: string;
  content: string;
  read: boolean;
  relatedId?: string;
  videoSlug?: string; // Slug video cho link /watch/{slug}
  actorId?: string;
  actorName?: string;
  avatarUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface NotificationPage {
  content: AppNotification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const notificationApi = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationPage> => {
    return axiosClient.get(`/notifications?page=${page}&size=${size}`);
  },

  getUnreadCount: async (): Promise<number> => {
    return axiosClient.get('/notifications/unread-count');
  },

  markAsRead: async (id: string): Promise<void> => {
    return axiosClient.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    return axiosClient.post('/notifications/read-all');
  },

  // Ẩn (xóa) một thông báo
  hideNotification: async (id: string): Promise<void> => {
    return axiosClient.delete(`/notifications/${id}`);
  },

  // Ẩn tất cả thông báo từ một kênh/người dùng (actorId)
  hideAllFromActor: async (actorId: string): Promise<void> => {
    return axiosClient.delete(`/notifications/actor/${actorId}`);
  },

  // Admin gửi thông báo: truyền recipientId/recipientEmail để gửi 1 user,
  // bỏ trống cả hai để gửi (broadcast) cho tất cả người dùng.
  // Interceptor đã unwrap về response.data.result (số lượng đã gửi).
  sendAdminNotification: async (payload: {
    recipientId?: string;
    recipientEmail?: string;
    title: string;
    content: string;
  }): Promise<number> => {
    return axiosClient.post('/notifications/admin/send', payload);
  },
};

export default notificationApi;
