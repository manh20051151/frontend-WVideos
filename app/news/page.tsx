'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { newsApi, type NewsResponse, type NewsCategoryResponse } from '@/lib/apis/news.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/common/Pagination';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function NewsListPage() {
  const [items, setItems] = useState<NewsResponse[]>([]);
  const [categories, setCategories] = useState<NewsCategoryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await newsApi.getPublishedNews(page, 9, categoryId || undefined, search || undefined);
      setItems(data.content);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-3xl font-bold text-foreground mb-6'>📰 Tin tức</h1>

          <div className='flex flex-col sm:flex-row gap-3 mb-6'>
            <input
              type='text'
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder='Tìm kiếm tin tức...'
              className='flex-1 px-4 py-2 rounded-lg border border-accent bg-secondary text-foreground'
            />
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
              className='px-4 py-2 rounded-lg border border-accent bg-secondary text-foreground'
            >
              <option value=''>Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className='text-center py-12 text-foreground opacity-60'>Đang tải...</div>
          ) : items.length === 0 ? (
            <div className='text-center py-12 text-foreground opacity-60'>Chưa có tin tức nào</div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {items.map((n) => (
                <Link key={n.id} href={`/news/${n.id}`} className='bg-secondary rounded-xl overflow-hidden border border-accent hover:shadow-lg transition-shadow'>
                  {n.thumbnailUrl ? (
                    <img src={n.thumbnailUrl} alt={n.title} className='w-full h-44 object-cover' />
                  ) : (
                    <div className='w-full h-44 bg-accent/20 flex items-center justify-center text-4xl'>📰</div>
                  )}
                  <div className='p-4'>
                    {n.category && (
                      <span className='inline-block px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-2'>
                        {n.category.name}
                      </span>
                    )}
                    <h2 className='font-semibold text-foreground line-clamp-2 mb-1'>{n.title}</h2>
                    <p className='text-sm text-foreground opacity-60 line-clamp-2'>{n.summary}</p>
                    <p className='text-xs text-foreground opacity-50 mt-2'>{fmtDate(n.publishedAt || n.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className='mt-8'>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
