import type { MetadataRoute } from 'next';

/**
 * sitemap.xml sinh tự động:
 * - Trang tĩnh (chủ, shorts, tin tức, thể loại).
 * - Toàn bộ video công khai dạng /watch/{slug} (lấy phân trang từ API backend).
 * Cache 1 giờ (ISR) để không dội API mỗi lần Googlebot tới.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';
const PAGE_SIZE = 100;
const MAX_PAGES = 50; // giới hạn 50 trang = 5.000 video, đủ cho giai đoạn đầu

interface SitemapVideo {
  id: string;
  slug?: string | null;
  updatedAt?: string | null;
}

interface SitemapNews {
  id: string;
  slug?: string | null;
  updatedAt?: string | null;
}

async function fetchPagedEntries(
  path: string,
  toEntry: (item: Record<string, unknown>, index: number) => { url: string; lastModified?: Date }
): Promise<{ entries: { url: string; lastModified?: Date }[]; totalPages: number }> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
  if (!res.ok) return { entries: [], totalPages: 0 };
  const body = await res.json();
  const result = body?.result ?? body;
  return {
    entries: (result?.content ?? []).map(toEntry),
    totalPages: result?.totalPages ?? 0,
  };
}

async function fetchPublicVideoEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < MAX_PAGES) {
    const { entries: pageEntries, totalPages: tp } = await fetchPagedEntries(
      `/videos/public?page=${page}&size=${PAGE_SIZE}&sort=newest`,
      (item) => {
        const v = item as unknown as SitemapVideo;
        return {
          url: `${SITE_URL}/watch/${v.slug || v.id}`,
          lastModified: v.updatedAt ? new Date(v.updatedAt) : undefined,
        };
      }
    );
    totalPages = tp;
    entries.push(
      ...pageEntries.map((e) => ({ ...e, changeFrequency: 'weekly' as const, priority: 0.6 }))
    );
    page++;
  }

  return entries;
}

async function fetchNewsEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < MAX_PAGES) {
    const { entries: pageEntries, totalPages: tp } = await fetchPagedEntries(
      `/news?page=${page}&size=${PAGE_SIZE}`,
      (item) => {
        const n = item as unknown as SitemapNews;
        return {
          url: `${SITE_URL}/news/${n.slug || n.id}`,
          lastModified: n.updatedAt ? new Date(n.updatedAt) : undefined,
        };
      }
    );
    totalPages = tp;
    entries.push(
      ...pageEntries.map((e) => ({ ...e, changeFrequency: 'weekly' as const, priority: 0.5 }))
    );
    page++;
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shorts`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/news`, changeFrequency: 'daily', priority: 0.7 },
  ];

  // Sitemap không được fail vì API lỗi — vẫn trả trang tĩnh
  let videoEntries: MetadataRoute.Sitemap = [];
  let newsEntries: MetadataRoute.Sitemap = [];
  try {
    videoEntries = await fetchPublicVideoEntries();
  } catch {
    // backend chưa sẵn sàng: bỏ qua phần video
  }
  try {
    newsEntries = await fetchNewsEntries();
  } catch {
    // backend chưa sẵn sàng: bỏ qua phần tin tức
  }

  return [...staticPages, ...videoEntries, ...newsEntries];
}
