import axiosClient from './axiosClient';

// Types cho FooterLink (liên kết trong footer)
export type FooterSection = 'QUICK_LINKS' | 'CATEGORIES' | 'SUPPORT' | 'SOCIAL' | 'BOTTOM';

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  section: FooterSection;
  icon?: string;
  isActive: boolean;
  openNewTab: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
}

export interface FooterLinkCreateRequest {
  label: string;
  href: string;
  section: FooterSection;
  icon?: string;
  isActive?: boolean;
  openNewTab?: boolean;
  sortOrder?: number;
}

export interface FooterLinkUpdateRequest {
  label: string;
  href: string;
  section: FooterSection;
  icon?: string;
  isActive?: boolean;
  openNewTab?: boolean;
  sortOrder?: number;
}

// Types cho FooterSetting (cấu hình footer)
export interface FooterSetting {
  id: string;
  settingKey: string;
  settingValue?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
}

export interface FooterSettingCreateRequest {
  settingKey: string;
  settingValue?: string;
  isActive?: boolean;
}

export interface FooterSettingUpdateRequest {
  settingKey: string;
  settingValue?: string;
  isActive?: boolean;
}

// Footer public - link nhóm theo section + settings key-value
export interface FooterInfo {
  links: Record<FooterSection, FooterLink[]>;
  settings: Record<string, string>;
}

// API functions
export const footerApi = {
  // Lấy toàn bộ thông tin footer đang hoạt động (public - cho frontend)
  getFooterInfo: async (): Promise<FooterInfo> => {
    return await axiosClient.get('/footer');
  },

  // Lấy tất cả footer link (admin only) với phân trang + tìm kiếm + lọc section
  getAllFooterLinksPaginated: async (params: {
    page: number;
    size: number;
    search?: string;
    section?: FooterSection;
  }): Promise<{
    content: FooterLink[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('size', params.size.toString());
    queryParams.append('sortBy', 'sortOrder');
    queryParams.append('direction', 'asc');
    if (params.search) queryParams.append('search', params.search);
    if (params.section) queryParams.append('section', params.section);

    return await axiosClient.get(`/footer/links/admin?${queryParams.toString()}`);
  },

  // Lấy footer link theo ID
  getFooterLinkById: async (id: string): Promise<FooterLink> => {
    return await axiosClient.get(`/footer/links/${id}`);
  },

  // Tạo footer link mới (admin only)
  createFooterLink: async (data: FooterLinkCreateRequest): Promise<FooterLink> => {
    return await axiosClient.post('/footer/links', data);
  },

  // Cập nhật footer link (admin only)
  updateFooterLink: async (id: string, data: FooterLinkUpdateRequest): Promise<FooterLink> => {
    return await axiosClient.put(`/footer/links/${id}`, data);
  },

  // Xóa footer link (admin only)
  deleteFooterLink: async (id: string): Promise<void> => {
    await axiosClient.delete(`/footer/links/${id}`);
  },

  // Lấy tất cả cấu hình footer (admin only)
  getAllFooterSettings: async (): Promise<FooterSetting[]> => {
    return await axiosClient.get('/footer/settings/admin');
  },

  // Tạo cấu hình footer mới (admin only)
  createFooterSetting: async (data: FooterSettingCreateRequest): Promise<FooterSetting> => {
    return await axiosClient.post('/footer/settings', data);
  },

  // Cập nhật cấu hình footer (admin only)
  updateFooterSetting: async (id: string, data: FooterSettingUpdateRequest): Promise<FooterSetting> => {
    return await axiosClient.put(`/footer/settings/${id}`, data);
  },

  // Xóa cấu hình footer (admin only)
  deleteFooterSetting: async (id: string): Promise<void> => {
    await axiosClient.delete(`/footer/settings/${id}`);
  },
};