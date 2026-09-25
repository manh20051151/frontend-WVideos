'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PublicVideoList from '@/components/video/PublicVideoList';

/**
 * Nội dung trang /tag/{tag}: dùng chung PublicVideoList
 * (sort chips + phân trang + URL sync như trang chủ).
 */
export default function TagView() {
    const params = useParams();
    const rawTag = params.tag as string;

    // Tag trong URL có thể được encode (tiếng Việt, ký tự đặc biệt)
    let tag = rawTag;
    try {
        tag = decodeURIComponent(rawTag);
    } catch {
        // giữ nguyên nếu không decode được
    }

    return (
        <>
            <Header />
            <div className='min-h-screen bg-primary'>
                <PublicVideoList
                    heading={`#${tag}`}
                    tag={tag}
                    emptyMessage='Chưa có video nào với tag này.'
                />
            </div>
            <Footer />
        </>
    );
}
