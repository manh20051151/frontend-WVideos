import axiosClient from './axiosClient';
import type { CategoryTranslation, CategoryTranslationUpsertItem } from './category.api';

export type { CategoryTranslation, CategoryTranslationUpsertItem };

export interface NewsCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
}

export interface NewsCategoryPage {
  content: NewsCategoryResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface NewsResponse {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string;
  status: 'DRAFT' | 'PUBLISHED';
  category?: NewsCategoryResponse | null;
  authorName?: string;
  views: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface NewsPage {
  content: NewsResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface NewsCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface NewsPayload {
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  categoryId?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

// Bản dịch bài tin tức theo ngôn ngữ (admin quản lý bản dịch Gemini)
export interface NewsTranslation {
  locale: string;
  title?: string | null; // null = ngôn ngữ chưa có bản dịch
  summary?: string | null;
  content?: string | null;
  updatedAt?: string | null;
}

export interface NewsTranslationUpsertItem {
  locale: string;
  title: string; // rỗng -> xóa bản dịch ngôn ngữ đó
  summary?: string;
  content?: string;
}

export const newsApi = {
  // ===== Categories =====
  getCategories: (): Promise<NewsCategoryResponse[]> =>
    axiosClient.get('/news-categories'),

  getCategoriesAdmin: (page = 0, size = 10, search = ''): Promise<NewsCategoryPage> =>
    axiosClient.get('/news-categories/admin', { params: { page, size, search } }),

  createCategory: (payload: NewsCategoryPayload): Promise<NewsCategoryResponse> =>
    axiosClient.post('/news-categories', payload),

  updateCategory: (id: string, payload: NewsCategoryPayload): Promise<NewsCategoryResponse> =>
    axiosClient.put(`/news-categories/${id}`, payload),

  deleteCategory: (id: string): Promise<void> =>
    axiosClient.delete(`/news-categories/${id}`),

  // Lấy mọi bản dịch tên của 1 danh mục tin tức (admin only)
  getCategoryTranslations: (id: string): Promise<CategoryTranslation[]> =>
    axiosClient.get(`/news-categories/${id}/translations`),

  // Admin cập nhật bản dịch tên danh mục tin tức sau khi Gemini dịch
  updateCategoryTranslations: (
    id: string,
    translations: CategoryTranslationUpsertItem[]
  ): Promise<CategoryTranslation[]> =>
    axiosClient.put(`/news-categories/${id}/translations`, { translations }),

  // ===== News =====
  getPublishedNews: (page = 0, size = 10, categoryId?: string, search?: string): Promise<NewsPage> =>
    axiosClient.get('/news', { params: { page, size, ...(categoryId ? { categoryId } : {}), ...(search ? { search } : {}) } }),

  getNewsAdmin: (page = 0, size = 10, search = ''): Promise<NewsPage> =>
    axiosClient.get('/news/admin', { params: { page, size, search } }),

  getNewsByIdAdmin: (id: string): Promise<NewsResponse> =>
    axiosClient.get(`/news/admin/${id}`),

  getNewsDetail: (id: string): Promise<NewsResponse> =>
    axiosClient.get(`/news/${id}`),

  createNews: (payload: NewsPayload): Promise<NewsResponse> =>
    axiosClient.post('/news', payload),

  updateNews: (id: string, payload: NewsPayload): Promise<NewsResponse> =>
    axiosClient.put(`/news/${id}`, payload),

  deleteNews: (id: string): Promise<void> =>
    axiosClient.delete(`/news/${id}`),

  // Lấy mọi bản dịch của 1 bài tin (admin only)
  getNewsTranslations: (id: string): Promise<NewsTranslation[]> =>
    axiosClient.get(`/news/${id}/translations`),

  // Admin cập nhật bản dịch bài tin sau khi Gemini dịch
  updateNewsTranslations: (
    id: string,
    translations: NewsTranslationUpsertItem[]
  ): Promise<NewsTranslation[]> =>
    axiosClient.put(`/news/${id}/translations`, { translations }),
};
