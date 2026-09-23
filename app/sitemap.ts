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

async function fetchPublicVideoEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < MAX_PAGES) {
    const res = await fetch(
      `${API_URL}/videos/public?page=${page}&size=${PAGE_SIZE}&sort=newest`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) break;

    // Backend bọc ApiResponse { code, message, result }
    const body = await res.json();
    const result = body?.result ?? body;
    totalPages = result?.totalPages ?? 1;

    for (const v of (result?.content ?? []) as SitemapVideo[]) {
      const path = v.slug ? `/watch/${v.slug}` : `/watch/${v.id}`;
      entries.push({
        url: `${SITE_URL}${path}`,
        lastModified: v.updatedAt ? new Date(v.updatedAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
    page++;
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shorts`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/news`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/the-loai`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  // Sitemap không được fail vì API lỗi — vẫn trả trang tĩnh
  let videoEntries: MetadataRoute.Sitemap = [];
  try {
    videoEntries = await fetchPublicVideoEntries();
  } catch {
    // backend chưa sẵn sàng: bỏ qua phần video
  }

  return [...staticPages, ...videoEntries];
}
