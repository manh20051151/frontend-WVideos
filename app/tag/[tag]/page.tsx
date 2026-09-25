import type { Metadata } from 'next';
import { Suspense } from 'react';
import TagView from './TagView';

/**
 * Server component cho trang /tag/{tag}:
 * - generateMetadata: title theo tag.
 * - UI interactive nằm ở TagView (client).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
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

async function tagHasVideos(tag: string): Promise<boolean> {
    try {
        const res = await fetch(
            `${API_URL}/videos/public?page=0&size=1&tag=${encodeURIComponent(tag)}`,
            { next: { revalidate: 600 } }
        );
        if (!res.ok) return false;
        const body = await res.json();
        const result = body?.result ?? body;
        return (result?.totalElements ?? 0) > 0;
    } catch {
        return false;
    }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
    const { tag: rawTag } = await params;
    const tag = decodeTag(rawTag);

    const hasVideos = await tagHasVideos(tag);

    return {
        title: `#${tag}`,
        description: `Xem các video có tag #${tag} trên snha.`,
        alternates: { canonical: `/tag/${rawTag}` },
        ...(hasVideos
            ? {}
            : { robots: { index: false } }),
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
