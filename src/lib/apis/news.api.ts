import axiosClient from './axiosClient';

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
  thumbnailUrl?: string;
  categoryId?: string;
  status: 'DRAFT' | 'PUBLISHED';
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
};
