import axiosClient from './axiosClient';
import type { ApiResponse, PageResponse } from '@/types';

/**
 * Báo cáo vi phạm video
 */
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface VideoReportResponse {
  id: number;
  videoId: string;
  videoTitle?: string | null;
  videoSlug?: string | null;
  videoThumbnailUrl?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reason: string; // Code lý do - map sang nhãn qua /report-reasons
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string | null;
  adminNote?: string | null;
}

/**
 * Lý do báo cáo - admin CRUD được danh sách này
 */
export interface ReportReasonItem {
  id: number;
  code: string;
  label: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ReportReasonPayload {
  code?: string; // Chỉ dùng khi tạo mới
  label: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Chờ xử lý',
  RESOLVED: 'Đã xử lý',
  DISMISSED: 'Đã bỏ qua',
};

// Icon mặc định khi lý do không có icon riêng
export const DEFAULT_REASON_ICON =
  'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';

const reportApi = {
  // ===== Lý do báo cáo =====

  // Danh sách lý do đang kích hoạt (public - cho modal báo cáo)
  getActiveReasons: async (): Promise<ReportReasonItem[]> => {
    const data = (await axiosClient.get('/report-reasons')) as unknown as ReportReasonItem[];
    return data ?? [];
  },

  // Admin: tất cả lý do (kể cả đã ẩn)
  getAllReasons: async (page = 0, size = 100): Promise<PageResponse<ReportReasonItem>> => {
    return await axiosClient.get('/report-reasons/all', { params: { page, size } });
  },

  // Admin: tạo lý do mới
  createReason: async (payload: ReportReasonPayload): Promise<ReportReasonItem> => {
    const response: ApiResponse<ReportReasonItem> = await axiosClient.post('/report-reasons', payload);
    return response.result!;
  },

  // Admin: cập nhật lý do (label/icon/thứ tự/kích hoạt)
  updateReason: async (id: number, payload: ReportReasonPayload): Promise<ReportReasonItem> => {
    const response: ApiResponse<ReportReasonItem> = await axiosClient.put(`/report-reasons/${id}`, payload);
    return response.result!;
  },

  // Admin: xóa lý do (bị chặn nếu đã có báo cáo dùng)
  deleteReason: async (id: number): Promise<void> => {
    await axiosClient.delete(`/report-reasons/${id}`);
  },

  // ===== Báo cáo =====

  // User báo cáo vi phạm video (reason là code lý do)
  reportVideo: async (videoId: string, reason: string, description?: string): Promise<VideoReportResponse> => {
    const response: ApiResponse<VideoReportResponse> = await axiosClient.post(`/reports/video/${videoId}`, {
      reason,
      description: description?.trim() || undefined,
    });
    return response.result!;
  },

  // User: danh sách báo cáo của chính mình
  getMyReports: async (page = 0, size = 10): Promise<PageResponse<VideoReportResponse>> => {
    return await axiosClient.get('/reports/my', { params: { page, size } });
  },

  // User: rút lại báo cáo đang chờ xử lý
  withdrawReport: async (reportId: number): Promise<void> => {
    await axiosClient.delete(`/reports/${reportId}`);
  },

  // Admin: danh sách báo cáo (lọc theo trạng thái)
  getReports: async (status?: ReportStatus, page = 0, size = 10): Promise<PageResponse<VideoReportResponse>> => {
    return await axiosClient.get('/reports', { params: { status: status || undefined, page, size } });
  },

  // Admin: số báo cáo theo trạng thái
  getCounts: async (): Promise<Record<string, number>> => {
    const data = (await axiosClient.get('/reports/counts')) as unknown as Record<string, number>;
    return data ?? { PENDING: 0, RESOLVED: 0, DISMISSED: 0 };
  },

  // Admin: xử lý báo cáo
  updateReportStatus: async (
    reportId: number,
    status: 'RESOLVED' | 'DISMISSED',
    adminNote?: string
  ): Promise<VideoReportResponse> => {
    const response: ApiResponse<VideoReportResponse> = await axiosClient.put(`/reports/${reportId}`, {
      status,
      adminNote: adminNote?.trim() || undefined,
    });
    return response.result!;
  },
};

export default reportApi;
