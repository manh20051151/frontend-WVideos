'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { newsApi, type NewsCategoryResponse } from '@/lib/apis/news.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TranslationsModal from '@/components/admin/TranslationsModal';
import ClientOnly from '@/components/common/ClientOnly';
import Pagination from '@/components/common/Pagination';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e').replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o').replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminNewsCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<NewsCategoryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  // Danh mục đang mở modal quản lý bản dịch tên (Gemini dịch tự động)
  const [translationsCategory, setTranslationsCategory] = useState<NewsCategoryResponse | null>(null);

  const isAdmin = !!user?.roles?.some((r) => r.name === 'ADMIN');

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/');
  }, [authLoading, isAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await newsApi.getCategoriesAdmin(page, 10, search);
      setItems(data.content);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <ClientOnly fallback={<><Header /><Footer /></>}>{null}</ClientOnly>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setName(''); setSlug(''); setSlugTouched(false);
    setDescription(''); setIsActive(true); setSortOrder(0);
    setShowForm(true);
  };

  const openEdit = (c: NewsCategoryResponse) => {
    setEditingId(c.id);
    setName(c.name); setSlug(c.slug); setSlugTouched(true);
    setDescription(c.description || ''); setIsActive(c.isActive ?? true);
    setSortOrder(c.sortOrder ?? 0);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      setError('Tên và slug không được để trống');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = { name: name.trim(), slug: slug.trim(), description, isActive, sortOrder };
      if (editingId) await newsApi.updateCategory(editingId, payload);
      else await newsApi.createCategory(payload);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa danh mục này?')) return;
    try {
      await newsApi.deleteCategory(id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <button onClick={() => router.push('/admin')} className='text-sm text-foreground opacity-60 hover:opacity-100 mb-2 inline-block'>
                ← Quay lại Dashboard
              </button>
              <h1 className='text-3xl font-bold text-foreground'>🗂️ Danh mục tin tức</h1>
            </div>
            <button onClick={openCreate} className='btn-accent font-medium py-2 px-4 rounded-lg'>
              + Thêm danh mục
            </button>
          </div>

          <div className='mb-4'>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Tìm kiếm danh mục...'
              className='w-full sm:w-80 px-4 py-2 rounded-lg border border-accent bg-secondary text-foreground'
            />
          </div>

          {error && <div className='mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm'>{error}</div>}

          <div className='bg-secondary rounded-xl border border-accent overflow-hidden'>
            <table className='w-full text-sm'>
              <thead className='bg-primary text-foreground'>
                <tr>
                  <th className='text-left p-3'>Tên</th>
                  <th className='text-left p-3'>Slug</th>
                  <th className='text-left p-3'>Trạng thái</th>
                  <th className='text-right p-3'>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className='p-6 text-center text-foreground opacity-60'>Đang tải...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className='p-6 text-center text-foreground opacity-60'>Chưa có danh mục nào</td></tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id} className='border-t border-accent/30'>
                      <td className='p-3 font-medium text-foreground'>{c.name}</td>
                      <td className='p-3 text-foreground opacity-60'>{c.slug}</td>
                      <td className='p-3'>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {c.isActive ? 'Hiện' : 'Ẩn'}
                        </span>
                      </td>
                      <td className='p-3 text-right whitespace-nowrap'>
                        <button onClick={() => openEdit(c)} className='text-accent hover:underline mr-3'>Sửa</button>
                        <button
                          onClick={() => setTranslationsCategory(c)}
                          className='text-accent hover:underline mr-3'
                          title='Quản lý bản dịch tên sang các ngôn ngữ'
                        >
                          Bản dịch
                        </button>
                        <button onClick={() => handleDelete(c.id)} className='text-red-600 hover:underline'>Xóa</button>
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
          <div className='relative bg-secondary rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-accent max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-semibold text-foreground mb-4'>
              {editingId ? 'Sửa danh mục' : 'Thêm danh mục'}
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>Tên</label>
                <input value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground' />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>Slug</label>
                <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground' />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>Mô tả</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className='w-full px-3 py-2 rounded-lg border border-accent bg-primary text-foreground resize-none' />
              </div>
              <div className='flex items-center gap-4'>
                <label className='flex items-center gap-2 text-foreground'>
                  <input type='checkbox' checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Hiển thị
                </label>
                <div className='flex items-center gap-2'>
                  <label className='text-sm text-foreground'>Thứ tự</label>
                  <input type='number' value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className='w-20 px-2 py-1 rounded-lg border border-accent bg-primary text-foreground' />
                </div>
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

      {/* Modal quản lý bản dịch tên danh mục (admin) */}
      {translationsCategory && (
        <TranslationsModal
          open={!!translationsCategory}
          onClose={() => setTranslationsCategory(null)}
          title={translationsCategory.name}
          categoryId={translationsCategory.id}
          api={newsApi}
        />
      )}

      <Footer />
    </>
  );
}
