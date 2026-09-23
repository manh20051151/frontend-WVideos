import type { Metadata } from 'next';
import ChannelView from './ChannelView';

/**
 * Server component cho trang /channel/{userId}:
 * - generateMetadata: title theo tên kênh (kênh là nội dung public, được index).
 * - JSON-LD ProfilePage.
 * - UI interactive nằm ở ChannelView (client).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';

interface SeoChannel {
  id: string;
  slug?: string | null;
  fullName?: string | null;
  avatar?: string | null;
}

async function getChannelForSeo(userId: string): Promise<SeoChannel | null> {
  try {
    const res = await fetch(`${API_URL}/users/${userId}/profile`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const channel = body?.result ?? body;
    return channel?.id ? (channel as SeoChannel) : null;
  } catch {
    return null;
  }
}

interface ChannelPageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: ChannelPageProps): Promise<Metadata> {
  const { userId } = await params;
  const channel = await getChannelForSeo(userId);

  if (!channel) {
    return {
      title: 'Kênh không tồn tại',
      robots: { index: false },
    };
  }

  const canonicalPath = `/channel/${channel.slug || channel.id}`;
  const title = channel.fullName ? `Kênh ${channel.fullName}` : 'Kênh';

  return {
    title,
    description: `Xem các video từ ${channel.fullName || 'kênh'} trên WVideos.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'profile',
      title,
      url: `${SITE_URL}${canonicalPath}`,
      images: channel.avatar ? [{ url: channel.avatar }] : undefined,
    },
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { userId } = await params;
  const channel = await getChannelForSeo(userId);

  const jsonLd =
    channel && channel.fullName
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: channel.fullName,
            image: channel.avatar || undefined,
            url: `${SITE_URL}/channel/${channel.slug || channel.id}`,
          },
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
      <ChannelView />
    </>
  );
}
