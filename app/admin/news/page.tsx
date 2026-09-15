'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { newsApi, type NewsResponse, type NewsCategoryResponse } from '@/lib/apis/news.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientOnly from '@/components/common/ClientOnly';
import Pagination from '@/components/common/Pagination';
import RichTextEditor from '@/components/common/RichTextEditor';
import ThumbnailSelector from '@/components/video/ThumbnailSelector';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e').replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o').replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminNewsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<NewsResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<NewsCategoryResponse[]>([]);

  // form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [saving, setSaving] = useState(false);

  const isAdmin = !!user?.roles?.some((r) => r.name === 'ADMIN');

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/');
  }, [authLoading, isAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await newsApi.getNewsAdmin(page, 10, search);
      setItems(data.content);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải tin tức');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (isAdmin) {
      load();
      newsApi.getCategories().then(setCategories).catch(() => {});
    }
  }, [isAdmin, load]);

  if (!isAdmin) {
    return <ClientOnly fallback={<><Header /><Footer /></>}>{null}</ClientOnly>;
  }

  const openCreate = () => {
    setEditingId(null);
    setTitle(''); setSlug(''); setSlugTouched(false);
    setSummary(''); setContent(''); setThumbnailUrl(''); setCategoryId('');
    setStatus('DRAFT');
    setError('');
    setShowForm(true);
  };

  const openEdit = async (n: NewsResponse) => {
    setEditingId(n.id);
    setTitle(n.title); setSlug(n.slug); setSlugTouched(true);
    setSummary(n.summary || ''); setContent(n.content || '');
    setThumbnailUrl(n.thumbnailUrl || '');
    setCategoryId(n.category?.id || '');
    setStatus(n.status);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      setError('Tiêu đề và slug không được để trống');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = { title: title.trim(), slug: slug.trim(), summary, content, thumbnailUrl, categoryId, status };
      if (editingId) await newsApi.updateNews(editingId, payload);
      else await newsApi.createNews(payload);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa tin tức này?')) return;
    try {
      await newsApi.deleteNews(id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-5xl mx-auto'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <button onClick={() => router.push('/admin')} className='text-sm text-foreground opacity-60 hover:opacity-100 mb-2 inline-block'>
                ← Quay lại Dashboard
              </button>
              <h1 className='text-3xl font-bold text-foreground'>📰 Quản lý tin tức</h1>
            </div>
            <div className='flex gap-2'>
              <button onClick={() => router.push('/admin/news-categories')} className='px-4 py-2 rounded-lg border border-accent text-foreground hover:bg-accent/10'>
                Danh mục
              </button>
              <button onClick={openCreate} className='btn-accent font-medium py-2 px-4 rounded-lg'>
                + Thêm tin tức
              </button>
            </div>
          </div>

          <div className='mb-4'>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Tìm kiếm tin tức...'
              className='w-full sm:w-80 px-4 py-2 rounded-lg border border-accent bg-secondary text-foreground'
            />
          </div>

          {error && <div className='mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm'>{error}</div>}

          <div className='bg-secondary rounded-xl border border-accent overflow-hidden'>
            <table className='w-full text-sm'>
              <thead className='bg-primary text-foreground'>
                <tr>
                  <th className='text-left p-3'>Tiêu đề</th>
                  <th className='text-left p-3'>Danh mục</th>
                  <th className='text-left p-3'>Trạng thái</th>
                  <th className='text-right p-3'>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className='p-6 text-center text-foreground opacity-60'>Đang tải...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className='p-6 text-center text-foreground opacity-60'>Chưa có tin tức nào</td></tr>
                ) : (
                  items.map((n) => (
                    <tr key={n.id} className='border-t border-accent/30'>
                      <td className='p-3'>
                        <div className='font-medium text-foreground line-clamp-1'>{n.title}</div>
                        <div className='text-xs text-foreground opacity-50'>{n.views} lượt xem</div>
                      </td>
                      <td className='p-3 text-foreground opacity-70'>{n.category?.name || '—'}</td>
                      <td className='p-3'>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${n.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {n.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                        </span>
                      </td>
                      <td className='p-3 text-right whitespace-nowrap'>
                        <button onClick={() => openEdit(n)} className='text-accent hover:underline mr-3'>Sửa</button>
                        <button onClick={() => handleDelete(n.id)} className='text-red-600 hover:underline'>Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className='mt-4'>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/70' onClick={() => setShowForm(false)} />
          <div className='relative bg-secondary rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-accent max-h-[92vh] overflow-y-auto'>
            <h3 className='text-lg font-semibold text-foreground mb-4'>
              {editingId ? 'Sửa tin tức' : 'Thêm tin tức'}
            </h3>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1 text-foreground'>Tiêu đề</label>
                  <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground' />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1 text-foreground'>Slug</label>
                  <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground' />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1 text-foreground'>Danh mục</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground'>
                    <option value=''>— Không có —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1 text-foreground'>Trạng thái</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground'>
                    <option value='DRAFT'>Nháp</option>
                    <option value='PUBLISHED'>Đã xuất bản</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>Ảnh đại diện</label>
                <ThumbnailSelector
                  thumbnailUrl={thumbnailUrl || null}
                  onThumbnailChange={(url) => setThumbnailUrl(url || '')}
                />
                <input
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder='Hoặc dán URL ảnh...'
                  className='w-full mt-2 px-3 py-2 rounded-lg border border-accent bg-primary text-foreground'
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>Tóm tắt</label>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground resize-none' />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>Nội dung (có thể style)</label>
                <RichTextEditor value={content} onChange={setContent} placeholder='Viết nội dung tin tức...' />
              </div>
            </div>

            {error && <div className='mt-3 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm'>{error}</div>}
            <div className='flex justify-end gap-3 mt-6'>
              <button onClick={() => setShowForm(false)} className='px-4 py-2 rounded-lg border border-accent text-foreground'>Hủy</button>
              <button onClick={handleSave} disabled={saving} className='btn-accent px-4 py-2 rounded-lg font-medium disabled:opacity-50'>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
