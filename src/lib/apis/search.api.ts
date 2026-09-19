import axiosClient from './axiosClient';
import type { PageResponse, VideoResponse } from '@/types';
import type { NewsResponse } from './news.api';

/**
 * Kết quả tìm kiếm kênh - chỉ chứa thông tin công khai
 */
export interface ChannelSearchResult {
  id: string;
  fullName: string;
  avatar?: string;
  channelSlug?: string; // dùng cho link /channel/{slug}
}

/**
 * Gợi ý nhanh trên header: video + kênh + tin tức
 */
export interface SearchSuggest {
  videos: VideoResponse[];
  channels: ChannelSearchResult[];
  news: NewsResponse[];
}

/**
 * Mục lịch sử tìm kiếm (user đăng nhập: từ server; khách: query + id giả)
 */
export interface SearchHistoryItem {
  id: number;
  query: string;
  searchCount?: number;
  searchedAt?: string;
}

const searchApi = {
  // Gợi ý nhanh khi gõ trên header (debounce ở caller)
  // Lưu ý: interceptor axiosClient đã unwrap response.data.result sẵn
  suggest: async (q: string, videoLimit = 5, channelLimit = 3, newsLimit = 3): Promise<SearchSuggest> => {
    const data = (await axiosClient.get('/search/suggest', {
      params: { q, videoLimit, channelLimit, newsLimit },
    })) as unknown as SearchSuggest;
    return data ?? { videos: [], channels: [], news: [] };
  },

  // Tìm video theo tiêu đề/mô tả/tag (phân trang)
  searchVideos: async (q: string, page = 0, size = 12): Promise<PageResponse<VideoResponse>> => {
    return await axiosClient.get('/search/videos', { params: { q, page, size } });
  },

  // Tìm kênh theo tên/slug kênh (phân trang)
  searchChannels: async (q: string, page = 0, size = 12): Promise<PageResponse<ChannelSearchResult>> => {
    return await axiosClient.get('/search/channels', { params: { q, page, size } });
  },

  // Tìm tin tức đã xuất bản (phân trang)
  searchNews: async (q: string, page = 0, size = 12): Promise<PageResponse<NewsResponse>> => {
    return await axiosClient.get('/search/news', { params: { q, page, size } });
  },

  // ==================== Lịch sử tìm kiếm ====================

  // Lịch sử tìm kiếm gần đây (khách sẽ nhận danh sách rỗng từ server)
  getHistory: async (limit = 10): Promise<SearchHistoryItem[]> => {
    const data = (await axiosClient.get('/search/history', { params: { limit } })) as unknown as SearchHistoryItem[];
    return data ?? [];
  },

  // Lưu từ khóa vừa tìm vào lịch sử (fire-and-forget ở caller)
  saveHistory: async (query: string): Promise<void> => {
    await axiosClient.post('/search/history', { query });
  },

  // Xóa 1 mục lịch sử
  deleteHistoryItem: async (id: number): Promise<void> => {
    await axiosClient.delete(`/search/history/${id}`);
  },

  // Xóa toàn bộ lịch sử
  clearHistory: async (): Promise<void> => {
    await axiosClient.delete('/search/history');
  },
};

export default searchApi;
