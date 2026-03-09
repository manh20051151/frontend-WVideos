import axiosClient from './axiosClient';

// Types cho Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdByUsername?: string;
  createdByName?: string; // Tên đầy đủ người tạo
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryUpdateRequest {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// API functions
export const categoryApi = {
  // Lấy tất cả thể loại đang hoạt động (public)
  getActiveCategories: async (): Promise<Category[]> => {
    return await axiosClient.get('/categories');
  },

  // Lấy tất cả thể loại (admin only) - deprecated, dùng getAllCategoriesPaginated
  getAllCategories: async (): Promise<Category[]> => {
    return await axiosClient.get('/categories/admin');
  },

  // Lấy tất cả thể loại với phân trang (admin only)
  getAllCategoriesPaginated: async (params: {
    page: number;
    size: number;
    sortBy?: string;
    direction?: string;
    search?: string;
  }): Promise<{
    content: Category[];
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
    
    return await axiosClient.get(`/categories/admin?${queryParams.toString()}`);
  },

  // Lấy thể loại theo ID
  getCategoryById: async (id: string): Promise<Category> => {
    return await axiosClient.get(`/categories/${id}`);
  },

  // Tạo thể loại mới (admin only)
  createCategory: async (data: CategoryCreateRequest): Promise<Category> => {
    return await axiosClient.post('/categories', data);
  },

  // Cập nhật thể loại (admin only)
  updateCategory: async (id: string, data: CategoryUpdateRequest): Promise<Category> => {
    return await axiosClient.put(`/categories/${id}`, data);
  },

  // Xóa thể loại (admin only)
  deleteCategory: async (id: string): Promise<void> => {
    await axiosClient.delete(`/categories/${id}`);
  },
};