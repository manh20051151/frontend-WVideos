/**
 * Cấu trúc response chung từ API
 */
export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
}

/**
 * Cấu trúc response dạng phân trang
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
