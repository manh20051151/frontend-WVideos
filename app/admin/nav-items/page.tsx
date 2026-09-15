'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { navItemApi, NavItem, NavItemCreateRequest, NavItemUpdateRequest } from '@/lib/apis/navitem.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientOnly from '@/components/common/ClientOnly';

export default function AdminNavItemsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingNavItem, setEditingNavItem] = useState<NavItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NavItemCreateRequest>({
    label: '',
    slug: '',
    href: '',
    icon: '',
    isActive: true,
    openNewTab: false,
    sortOrder: 0,
  });

  // Check admin permission
  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.some(role => role.name === 'ADMIN'))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load nav items khi thay đổi page, itemsPerPage hoặc search
  useEffect(() => {
    if (user && user.roles?.some(role => role.name === 'ADMIN')) {
      loadNavItems();
    }
  }, [user, currentPage, itemsPerPage, searchQuery]);

  // Lấy nav items từ API với phân trang
  const loadNavItems = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage - 1, // Backend dùng 0-indexed
        size: itemsPerPage,
        sortBy: 'sortOrder',
        direction: 'asc',
        search: searchQuery || undefined
      };

      const data = await navItemApi.getAllNavItemsPaginated(params);
      setNavItems(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Error loading nav items:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách menu');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNavItem(null);
    setFormData({
      label: '',
      slug: '',
      href: '',
      icon: '',
      isActive: true,
      openNewTab: false,
      sortOrder: navItems?.length || 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (navItem: NavItem) => {
    setEditingNavItem(navItem);
    setFormData({
      label: navItem.label,
      slug: navItem.slug,
      href: navItem.href,
      icon: navItem.icon || '',
      isActive: navItem.isActive,
      openNewTab: navItem.openNewTab,
      sortOrder: navItem.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingNavItem) {
        const updated = await navItemApi.updateNavItem(editingNavItem.id, formData as NavItemUpdateRequest);
        setNavItems(prev => (prev || []).map(item => item.id === editingNavItem.id ? updated : item));
      } else {
        const created = await navItemApi.createNavItem(formData);
        setNavItems(prev => [...(prev || []), created]);
      }

      setIsModalOpen(false);
      setEditingNavItem(null);
    } catch (err: any) {
      console.error('Error saving nav item:', err);
      alert(err.response?.data?.message || 'Lỗi khi lưu mục menu');
    }
  };

  const handleDelete = async (navItem: NavItem) => {
    if (!confirm(`Bạn có chắc muốn xóa mục menu "${navItem.label}"?`)) return;

    try {
      await navItemApi.deleteNavItem(navItem.id);
      setNavItems(prev => prev.filter(item => item.id !== navItem.id));
    } catch (err: any) {
      console.error('Error deleting nav item:', err);
      alert(err.response?.data?.message || 'Lỗi khi xóa mục menu');
    }
  };

  const generateSlug = (label: string) => {
    const vietnameseMap: Record<string, string> = {
      'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
      'đ': 'd',
    };

    return label
      .toLowerCase()
      .split('')
      .map(char => vietnameseMap[char] || char)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Auto-generate slug when label changes
  useEffect(() => {
    if (formData.label && !editingNavItem) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.label) }));
    }
  }, [formData.label, editingNavItem]);

  // Reset về trang 1 khi search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Show loading or unauthorized
  if (!user || !user.roles?.some(role => role.name === 'ADMIN')) {
    return (
      <ClientOnly fallback={
        <>
          <Header />
          <div className='min-h-screen bg-primary flex items-center justify-center'>
            <div className='animate-pulse text-center'>
              <div className='w-16 h-16 bg-secondary rounded-full mx-auto mb-4'></div>
              <div className='h-4 bg-secondary rounded w-32 mx-auto'></div>
            </div>
          </div>
          <Footer />
        </>
      }>
        {null}
      </ClientOnly>
    );
  }

  return (
    <>
      <Header />
      <div className='min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>
                🧭 Quản lý Menu điều hướng
              </h1>
              <p className='mt-2 text-foreground opacity-70'>
                Thêm, sửa, xóa các mục trên thanh menu chính
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className='btn-accent font-medium py-2 px-4 rounded-lg transition-colors'
            >
              + Thêm mục menu
            </button>
          </div>

          {/* Search Bar */}
          <div className='mb-6'>
            <div className='relative'>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='🔍 Tìm kiếm theo tên, slug, đường dẫn hoặc người tạo...'
                className='w-full px-4 py-3 pl-12 bg-secondary border border-accent rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all'
              />
              <svg
                className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-foreground opacity-50 hover:opacity-100 transition-opacity'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className='mt-2 text-sm text-foreground opacity-70'>
                Tìm thấy {totalElements} kết quả
              </p>
            )}
          </div>

          {/* Items per page selector */}
          {!loading && navItems && navItems.length > 0 && (
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <label className='text-sm text-foreground opacity-70'>Hiển thị:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className='px-3 py-1 bg-secondary border border-accent rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent'
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className='text-sm text-foreground opacity-70'>mục/trang</span>
              </div>
              <div className='text-sm text-foreground opacity-70'>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalElements)} trong tổng số {totalElements} mục menu
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
              <p className='text-red-600'>{error}</p>
              <button
                onClick={loadNavItems}
                className='mt-2 text-red-700 hover:text-red-800 font-medium'
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Nav Items Table */}
          <div className='bg-secondary rounded-xl shadow-sm border border-accent overflow-hidden'>
            {loading ? (
              <div className='p-8 text-center'>
                <div className='animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4'></div>
                <p className='text-foreground opacity-70'>Đang tải...</p>
              </div>
            ) : navItems?.length === 0 ? (
              <div className='p-8 text-center'>
                <div className='text-4xl mb-4'>
                  {searchQuery ? '🔍' : '🧭'}
                </div>
                <p className='text-foreground opacity-70 mb-4'>
                  {searchQuery ? 'Không tìm thấy mục menu nào' : 'Chưa có mục menu nào'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={openCreateModal}
                    className='btn-accent font-medium py-2 px-4 rounded-lg'
                  >
                    Tạo mục menu đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-primary border-b border-accent'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                        Mục menu
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                        Đường dẫn
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                        Người tạo
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                        Tab mới
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                        Trạng thái
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                        Thứ tự
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-accent'>
                    {navItems?.filter(item => item).map((navItem) => (
                      <tr key={navItem.id} className='hover:bg-primary transition-colors'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center'>
                            <span className='text-lg mr-2'>{navItem.icon || '🔗'}</span>
                            <span className='text-sm font-medium text-foreground'>
                              {navItem.label}
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground opacity-70'>
                          <a
                            href={navItem.href}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-accent hover:text-highlight transition-colors'
                          >
                            {navItem.href}
                          </a>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {navItem.createdByName || navItem.createdByUsername || '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {navItem.openNewTab ? '✅' : '❌'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            navItem.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {navItem.isActive ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {navItem.sortOrder}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <div className='flex space-x-2'>
                            <button
                              onClick={() => openEditModal(navItem)}
                              className='text-accent hover:text-highlight transition-colors'
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(navItem)}
                              className='text-red-600 hover:text-red-800 transition-colors'
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && navItems && navItems.length > 0 && totalPages > 1 && (
            <div className='mt-6 flex items-center justify-center gap-2'>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className='px-4 py-2 bg-secondary border border-accent rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors'
              >
                ← Trước
              </button>

              <div className='flex items-center gap-1'>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-accent text-white font-medium'
                            : 'bg-secondary border border-accent text-foreground hover:bg-primary'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className='px-2 text-foreground opacity-50'>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className='px-4 py-2 bg-secondary border border-accent rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors'
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='bg-primary rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b border-accent'>
              <h2 className='text-xl font-semibold text-foreground'>
                {editingNavItem ? '✏️ Sửa mục menu' : '➕ Thêm mục menu'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className='text-foreground hover:text-accent transition-colors'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Tên hiển thị *
                </label>
                <input
                  type='text'
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className='auth-input'
                  placeholder='VD: Tin tức'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Slug *
                </label>
                <input
                  type='text'
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className='auth-input'
                  placeholder='VD: tin-tuc'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Đường dẫn (href) *
                </label>
                <input
                  type='text'
                  value={formData.href}
                  onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                  className='auth-input'
                  placeholder='VD: /news'
                  required
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-foreground mb-2'>
                    Icon
                  </label>
                  <input
                    type='text'
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className='auth-input'
                    placeholder='🔗'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-foreground mb-2'>
                    Thứ tự
                  </label>
                  <input
                    type='number'
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className='auth-input'
                    min='0'
                  />
                </div>
              </div>

              <div className='flex items-center gap-6'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='isActive'
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className='h-4 w-4 text-accent focus:ring-accent border-accent rounded'
                  />
                  <label htmlFor='isActive' className='ml-2 block text-sm text-foreground'>
                    Hiển thị trên menu
                  </label>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='openNewTab'
                    checked={formData.openNewTab}
                    onChange={(e) => setFormData({ ...formData, openNewTab: e.target.checked })}
                    className='h-4 w-4 text-accent focus:ring-accent border-accent rounded'
                  />
                  <label htmlFor='openNewTab' className='ml-2 block text-sm text-foreground'>
                    Mở tab mới
                  </label>
                </div>
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='flex-1 px-4 py-2 border border-accent text-foreground rounded-lg hover:bg-secondary transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='flex-1 btn-accent px-4 py-2 rounded-lg transition-colors'
                >
                  {editingNavItem ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
