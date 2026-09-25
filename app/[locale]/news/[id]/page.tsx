import type { Metadata } from 'next';
import NewsDetailView from './NewsDetailView';
import { routing } from '@/i18n/routing';

/**
 * Server component cho trang /news/{id}:
 * - generateMetadata: title/mô tả/OG theo tin tức thật.
 * - JSON-LD NewsArticle để Google hiểu đây là bài báo.
 * - UI interactive nằm ở NewsDetailView (client).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';

interface SeoNews {
  id: string;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  thumbnailUrl?: string | null;
  authorName?: string | null;
  createdAt?: string | null;
}

async function getNewsForSeo(id: string): Promise<SeoNews | null> {
  try {
    const res = await fetch(`${API_URL}/news/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const news = body?.result ?? body;
    return news?.id ? (news as SeoNews) : null;
  } catch {
    return null;
  }
}

interface NewsDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const news = await getNewsForSeo(id);

  if (!news) {
    return {
      title: 'Tin tức không tồn tại',
      robots: { index: false },
    };
  }

  const canonicalPath = `/news/${news.slug || news.id}`;
  const description = (news.summary || '').slice(0, 160) || 'Tin tức trên snha';

  return {
    title: news.title || 'Tin tức',
    description,
    alternates: {
      canonical: canonicalPath,
      // hreflang: vi ở root, các locale khác có prefix
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          l === routing.defaultLocale ? canonicalPath : `/${l}${canonicalPath}`,
        ])
      ),
    },
    openGraph: {
      type: 'article',
      title: news.title || 'Tin tức',
      description,
      url: `${SITE_URL}${canonicalPath}`,
      images: news.thumbnailUrl ? [{ url: news.thumbnailUrl }] : undefined,
      publishedTime: news.createdAt || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title || 'Tin tức',
      description,
      images: news.thumbnailUrl ? [news.thumbnailUrl] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const news = await getNewsForSeo(id);

  const jsonLd =
    news && news.title
      ? {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: news.title,
          description: (news.summary || '').slice(0, 300) || news.title,
          image: news.thumbnailUrl ? [news.thumbnailUrl] : undefined,
          datePublished: news.createdAt || undefined,
          author: news.authorName ? { '@type': 'Person', name: news.authorName } : undefined,
          url: `${SITE_URL}/news/${news.slug || news.id}`,
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <NewsDetailView />
    </>
  );
}
