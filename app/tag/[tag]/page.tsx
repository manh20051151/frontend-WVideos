import type { Metadata } from 'next';
import { Suspense } from 'react';
import TagView from './TagView';

/**
 * Server component cho trang /tag/{tag}:
 * - generateMetadata: title theo tag.
 * - UI interactive nằm ở TagView (client).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';

interface TagPageProps {
    params: Promise<{ tag: string }>;
}

function decodeTag(raw: string): string {
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
    const { tag: rawTag } = await params;
    const tag = decodeTag(rawTag);

    return {
        title: `#${tag}`,
        description: `Xem các video có tag #${tag} trên WVideos.`,
        alternates: { canonical: `/tag/${rawTag}` },
        openGraph: {
            type: 'website',
            title: `#${tag}`,
            url: `${SITE_URL}/tag/${rawTag}`,
        },
    };
}

export default async function TagPage({ params }: TagPageProps) {
    const { tag: rawTag } = await params;
    const tag = decodeTag(rawTag);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `#${tag}`,
        url: `${SITE_URL}/tag/${rawTag}`,
    };

    return (
        <>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Suspense>
                <TagView />
            </Suspense>
        </>
    );
}
