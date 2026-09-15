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
  const [related, setRelated] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    newsApi.getNewsDetail(id)
      .then(setNews)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tìm thấy tin tức'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!news) return;
    const categoryId = news.category?.id;
    newsApi.getPublishedNews(0, 6, categoryId || undefined)
      .then((data) => {
        const list = data.content.filter((n) => n.id !== id).slice(0, 5);
        setRelated(list);
      })
      .catch(() => setRelated([]));
  }, [news, id]);

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
        <div className='mx-auto'>
          <Link href='/news' className='inline-flex items-center gap-1 text-sm text-foreground opacity-60 hover:opacity-100 transition-opacity'>
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <polyline points='15 18 9 12 15 6' />
            </svg>
            Quay lại tin tức
          </Link>

          <div className='grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-6'>
            {/* Nội dung chính */}
            <article className='min-w-0'>
              {news.category && (
                <span className='inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold'>
                  {news.category.name}
                </span>
              )}

              <h1 className='text-3xl sm:text-4xl font-bold text-foreground leading-tight mt-4 mb-5'>
                {news.title}
              </h1>

              <div className='flex flex-wrap items-center gap-3 text-sm text-foreground opacity-60 mb-6'>
                {news.authorName && (
                  <div className='flex items-center gap-2'>
                    <span className='flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent font-semibold text-xs'>
                      {news.authorName.charAt(0).toUpperCase()}
                    </span>
                    <span className='font-medium text-foreground opacity-80'>{news.authorName}</span>
                  </div>
                )}
                <span>{fmtDate(news.publishedAt || news.createdAt)}</span>
                <span className='flex items-center gap-1'>
                  <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z' />
                    <circle cx='12' cy='12' r='3' />
                  </svg>
                  {news.views} lượt xem
                </span>
              </div>

              {news.thumbnailUrl && (
                <img
                  src={news.thumbnailUrl}
                  alt={news.title}
                  className='w-full rounded-2xl mb-8 object-cover max-h-[460px] shadow-sm'
                />
              )}

              {news.summary && (
                <p className='text-lg text-foreground opacity-80 leading-relaxed mb-8 pb-6 border-b border-accent/15'>
                  {news.summary}
                </p>
              )}

              <div
                className='article-content'
                dangerouslySetInnerHTML={{ __html: news.content || '' }}
              />
            </article>

            {/* Sidebar bài viết liên quan */}
            <aside className='lg:sticky lg:top-6 h-fit'>
              <div className='bg-secondary rounded-2xl border border-accent/15 p-5'>
                <h3 className='text-sm font-semibold uppercase tracking-wider text-foreground opacity-70 mb-4'>
                  Bài viết liên quan
                </h3>
                {related.length === 0 ? (
                  <p className='text-sm text-foreground opacity-50'>Chưa có bài viết liên quan</p>
                ) : (
                  <ul className='space-y-4'>
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link href={`/news/${r.id}`} className='flex gap-3 group'>
                          <div className='w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-accent/10'>
                            {r.thumbnailUrl ? (
                              <img src={r.thumbnailUrl} alt={r.title} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' />
                            ) : (
                              <div className='w-full h-full flex items-center justify-center text-xl'>📰</div>
                            )}
                          </div>
                          <div className='min-w-0'>
                            <p className='text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors'>
                              {r.title}
                            </p>
                            <p className='text-xs text-foreground opacity-50 mt-1'>{fmtDate(r.publishedAt || r.createdAt)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
