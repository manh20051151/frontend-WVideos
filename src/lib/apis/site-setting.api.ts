import axiosClient from './axiosClient';

// Types cho SiteSetting (logo, favicon do admin cấu hình)
export interface SiteSettingInfo {
  settingKey: string;
  settingValue?: string | null;
  updatedAt?: string | null;
}

export const SITE_SETTING_LABELS: Record<string, { title: string; description: string }> = {
  SITE_LOGO: {
    title: 'Logo site',
    description: 'Hiển thị trên header website và trong email hệ thống (xác nhận đăng ký, đặt lại mật khẩu)',
  },
  SITE_FAVICON: {
    title: 'Favicon',
    description: 'Biểu tượng nhỏ trên tab trình duyệt (khuyến nghị ảnh vuông ≥ 64x64)',
  },
};

// API functions
export const siteSettingApi = {
  // Lấy cấu hình public (FE hiển thị logo/favicon)
  getPublicSettings: async (): Promise<Record<string, string>> => {
    return await axiosClient.get('/site-settings');
  },

  // Lấy tất cả cấu hình (admin only)
  getAll: async (): Promise<SiteSettingInfo[]> => {
    return await axiosClient.get('/admin/site-settings');
  },

  // Cập nhật cấu hình theo key (admin only) - value rỗng = xóa về mặc định
  update: async (key: string, value: string): Promise<SiteSettingInfo> => {
    return await axiosClient.put(`/admin/site-settings/${key}`, { value });
  },
};
