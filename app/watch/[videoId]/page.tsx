import type { Metadata } from 'next';
import WatchView from './WatchView';

/**
 * Server component cho trang /watch/{videoId}:
 * - generateMetadata: title/mô tả/OG theo video thật (title template %s | snha ở layout).
 * - JSON-LD VideoObject để Google hiện rich result (thumbnail, ngày đăng).
 * - UI interactive nằm ở WatchView (client).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';

interface SeoVideo {
  id: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  splashImageUrl?: string | null;
  embedUrl?: string | null;
  createdAt?: string | null;
  status?: string;
}

// Fetch cho metadata/JSON-LD. Video riêng tư -> 401/403 -> trả null (không index).
// Next cache theo revalidate nên generateMetadata + render chỉ đi API 1 lần.
async function getVideoForSeo(videoId: string): Promise<SeoVideo | null> {
  try {
    const res = await fetch(`${API_URL}/videos/${videoId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const video = body?.result ?? body;
    return video?.id ? (video as SeoVideo) : null;
  } catch {
    return null;
  }
}

interface WatchPageProps {
  params: Promise<{ videoId: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { videoId } = await params;
  const video = await getVideoForSeo(videoId);

  if (!video) {
    return {
      title: 'Video không tồn tại',
      robots: { index: false },
    };
  }

  const canonicalPath = `/watch/${video.slug || video.id}`;
  const description = (video.description || '').slice(0, 160) || 'Xem video trên snha';
  const image = video.splashImageUrl || video.thumbnailUrl || undefined;

  return {
    title: video.title || 'Video',
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'video.other',
      title: video.title || 'Video',
      description,
      url: `${SITE_URL}${canonicalPath}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title || 'Video',
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = await params;
  const video = await getVideoForSeo(videoId);

  const jsonLd =
    video && video.title
      ? {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video.title,
          description: (video.description || '').slice(0, 500) || video.title,
          thumbnailUrl: [video.splashImageUrl, video.thumbnailUrl].filter(Boolean),
          uploadDate: video.createdAt || undefined,
          embedUrl: video.embedUrl || undefined,
          url: `${SITE_URL}/watch/${video.slug || video.id}`,
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
      <WatchView />
    </>
  );
}
