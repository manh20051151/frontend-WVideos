'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { newsApi, type NewsResponse } from '@/lib/apis/news.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    newsApi.getNewsDetail(id)
      .then(setNews)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tìm thấy tin tức'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className='min-h-screen bg-primary flex items-center justify-center text-foreground opacity-60'>Đang tải...</div>
        <Footer />
      </>
    );
  }

  if (error || !news) {
    return (
      <>
        <Header />
        <div className='min-h-screen bg-primary flex flex-col items-center justify-center text-foreground'>
          <p className='mb-4'>{error || 'Tin tức không tồn tại'}</p>
          <Link href='/news' className='btn-accent px-4 py-2 rounded-lg'>Quay lại tin tức</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto'>
          <Link href='/news' className='text-sm text-foreground opacity-60 hover:opacity-100'>← Quay lại tin tức</Link>

          {news.category && (
            <span className='inline-block mt-4 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium'>
              {news.category.name}
            </span>
          )}
          <h1 className='text-3xl font-bold text-foreground mt-2 mb-2'>{news.title}</h1>
          <p className='text-sm text-foreground opacity-60 mb-4'>
            {news.authorName ? `Tác giả: ${news.authorName} · ` : ''}{fmtDate(news.publishedAt || news.createdAt)}
            {news.views > 0 && ` · ${news.views} lượt xem`}
          </p>

          {news.thumbnailUrl && (
            <img src={news.thumbnailUrl} alt={news.title} className='w-full rounded-xl mb-6 object-cover max-h-[420px]' />
          )}

          {news.summary && (
            <p className='text-lg text-foreground opacity-80 italic mb-6'>{news.summary}</p>
          )}

          {/* Nội dung HTML (admin soạn thảo, cho phép style) */}
          <article
            className='prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-a:text-accent'
            dangerouslySetInnerHTML={{ __html: news.content || '' }}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
