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
  const [totalElements, setTotalElements] = useState(0);
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
      setTotalElements(data.totalElements);
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, search]);

  useEffect(() => { load(); }, [load]);

  const activeCategoryName =
    categoryId === '' ? 'Tất cả tin tức' : categories.find((c) => c.id === categoryId)?.name || 'Tin tức';

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8'>

            {/* Sidebar danh mục bên trái */}
            <aside className='lg:sticky lg:top-6 h-fit'>
              <div className='bg-secondary rounded-2xl border border-accent/20 p-5'>
                <h2 className='text-sm font-semibold uppercase tracking-wider text-foreground opacity-60 mb-4'>
                  Danh mục
                </h2>
                <nav className='space-y-1'>
                  <button
                    onClick={() => { setCategoryId(''); setPage(0); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      categoryId === ''
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-foreground opacity-80 hover:bg-primary hover:opacity-100'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCategoryId(c.id); setPage(0); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        categoryId === c.id
                          ? 'bg-accent text-white shadow-sm'
                          : 'text-foreground opacity-80 hover:bg-primary hover:opacity-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  {categories.length === 0 && !loading && (
                    <p className='px-4 py-2 text-sm text-foreground opacity-50'>Chưa có danh mục</p>
                  )}
                </nav>
              </div>
            </aside>

            {/* Tin tức bên phải */}
            <main>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                <div>
                  <h1 className='text-3xl font-bold text-foreground flex items-center gap-2.5'>
                    <svg className='w-7 h-7 text-accent flex-shrink-0' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v1m-4-3v9a2 2 0 002 2h0a2 2 0 002-2v-5.34a2 2 0 00-.3-1.07l-1.83-3A2 2 0 0018.6 10H16zM7 9h6M7 13h6' />
                    </svg>
                    <span>{activeCategoryName}</span>
                  </h1>
                  <p className='text-sm text-foreground opacity-60 mt-1'>
                    {loading ? 'Đang tải...' : `${totalElements} bài viết`}
                  </p>
                </div>
                <div className='relative w-full sm:w-72'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-foreground opacity-40'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                  </span>
                  <input
                    type='text'
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    placeholder='Tìm kiếm tin tức...'
                    className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-accent/30 bg-secondary text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition'
                  />
                </div>
              </div>

              {loading ? (
                <div className='grid grid-cols-2 lg:grid-cols-3 gap-5'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className='bg-secondary rounded-2xl overflow-hidden border border-accent/15 animate-pulse'>
                      <div className='w-full aspect-[16/10] bg-accent/10' />
                      <div className='p-4 space-y-2'>
                        <div className='h-4 w-3/4 rounded bg-accent/10' />
                        <div className='h-3 w-full rounded bg-accent/10' />
                        <div className='h-3 w-1/2 rounded bg-accent/10 mt-3' />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className='text-center py-20 bg-secondary rounded-2xl border border-accent/20 text-foreground opacity-60'>
                  <div className='text-5xl mb-3'>🗞️</div>
                  Chưa có tin tức nào
                </div>
              ) : (
                <div className='grid grid-cols-2 lg:grid-cols-3 gap-5'>
                  {items.map((n) => (
                    <Link
                      key={n.id}
                      href={`/news/${n.slug || n.id}`}
                      className='group flex flex-col bg-secondary rounded-2xl overflow-hidden border border-accent/15 hover:border-accent/60 hover:-translate-y-1 hover:shadow-xl transition-all duration-200'
                    >
                      <div className='relative overflow-hidden'>
                        {n.thumbnailUrl ? (
                          <img
                            src={n.thumbnailUrl}
                            alt={n.title}
                            className='w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-300'
                          />
                        ) : (
                          <div className='w-full aspect-[16/10] bg-gradient-to-br from-accent/25 to-accent/5 flex items-center justify-center text-5xl'>
                            📰
                          </div>
                        )}
                        {n.category && (
                          <span className='absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent/90 backdrop-blur text-white text-[11px] font-semibold shadow'>
                            {n.category.name}
                          </span>
                        )}
                      </div>
                      <div className='p-4 flex flex-col flex-1'>
                        <h2 className='font-bold text-foreground text-[15px] leading-snug line-clamp-2 group-hover:text-accent transition-colors'>
                          {n.title}
                        </h2>
                        {n.summary && (
                          <p className='text-xs text-foreground opacity-60 line-clamp-2 mt-1.5'>{n.summary}</p>
                        )}
                        <div className='mt-auto pt-3 flex items-center justify-between text-[11px] text-foreground opacity-50 border-t border-accent/10'>
                          <span>{fmtDate(n.publishedAt || n.createdAt)}</span>
                          <span className='flex items-center gap-1'>
                            <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                              <path d='M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z' />
                              <circle cx='12' cy='12' r='3' />
                            </svg>
                            {n.views}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className='mt-10 flex justify-center'>
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
