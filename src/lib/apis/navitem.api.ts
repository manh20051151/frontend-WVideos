import axiosClient from './axiosClient';

// Types cho NavItem (mục menu điều hướng)
export interface NavItem {
  id: string;
  label: string;
  slug: string;
  href: string;
  icon?: string;
  isActive: boolean;
  openNewTab: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdByUsername?: string;
  createdByName?: string; // Tên đầy đủ người tạo
}

export interface NavItemCreateRequest {
  label: string;
  slug: string;
  href: string;
  icon?: string;
  isActive?: boolean;
  openNewTab?: boolean;
  sortOrder?: number;
}

export interface NavItemUpdateRequest {
  label: string;
  slug: string;
  href: string;
  icon?: string;
  isActive?: boolean;
  openNewTab?: boolean;
  sortOrder?: number;
}

// API functions
export const navItemApi = {
  // Lấy tất cả mục menu đang hoạt động (public - cho frontend)
  getActiveNavItems: async (): Promise<NavItem[]> => {
    return await axiosClient.get('/nav-items');
  },

  // Lấy tất cả mục menu (admin only) với phân trang
  getAllNavItemsPaginated: async (params: {
    page: number;
    size: number;
    sortBy?: string;
    direction?: string;
    search?: string;
  }): Promise<{
    content: NavItem[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.search) queryParams.append('search', params.search);

    return await axiosClient.get(`/nav-items/admin?${queryParams.toString()}`);
  },

  // Lấy mục menu theo ID
  getNavItemById: async (id: string): Promise<NavItem> => {
    return await axiosClient.get(`/nav-items/${id}`);
  },

  // Tạo mục menu mới (admin only)
  createNavItem: async (data: NavItemCreateRequest): Promise<NavItem> => {
    return await axiosClient.post('/nav-items', data);
  },

  // Cập nhật mục menu (admin only)
  updateNavItem: async (id: string, data: NavItemUpdateRequest): Promise<NavItem> => {
    return await axiosClient.put(`/nav-items/${id}`, data);
  },

  // Xóa mục menu (admin only)
  deleteNavItem: async (id: string): Promise<void> => {
    await axiosClient.delete(`/nav-items/${id}`);
  },
};
