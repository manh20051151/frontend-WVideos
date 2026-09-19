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
};

export default searchApi;
