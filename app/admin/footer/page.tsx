'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  footerApi,
  FooterLink,
  FooterLinkCreateRequest,
  FooterLinkUpdateRequest,
  FooterSetting,
  FooterSettingCreateRequest,
  FooterSettingUpdateRequest,
  FooterSection,
} from '@/lib/apis/footer.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientOnly from '@/components/common/ClientOnly';

// Tên hiển thị của từng khu vực footer
const SECTION_LABELS: Record<FooterSection, string> = {
  QUICK_LINKS: 'Liên kết nhanh',
  CATEGORIES: 'Danh mục',
  SUPPORT: 'Hỗ trợ',
  SOCIAL: 'Mạng xã hội',
  BOTTOM: 'Dòng dưới cùng',
};

const SECTION_EMOJIS: Record<FooterSection, string> = {
  QUICK_LINKS: '🔗',
  CATEGORIES: '🗂️',
  SUPPORT: '🛟',
  SOCIAL: '🌐',
  BOTTOM: '⬇️',
};

const ALL_SECTIONS: FooterSection[] = ['QUICK_LINKS', 'CATEGORIES', 'SUPPORT', 'SOCIAL', 'BOTTOM'];

export default function AdminFooterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State cho tab hiện tại
  const [activeTab, setActiveTab] = useState<'links' | 'settings'>('links');

  // State cho danh sách link
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<FooterSection | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State cho danh sách cài đặt
  const [footerSettings, setFooterSettings] = useState<FooterSetting[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [error, setError] = useState('');

  // State cho modal link
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [linkFormData, setLinkFormData] = useState<FooterLinkCreateRequest>({
    label: '',
    href: '',
    section: 'QUICK_LINKS',
    icon: '',
    isActive: true,
    openNewTab: false,
    sortOrder: 0,
  });

  // State cho modal setting
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<FooterSetting | null>(null);
  const [settingFormData, setSettingFormData] = useState<FooterSettingCreateRequest>({
    settingKey: '',
    settingValue: '',
    isActive: true,
  });

  // Check admin permission
  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.some(role => role.name === 'ADMIN'))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load footer links khi thay đổi page, itemsPerPage, search hoặc section
  useEffect(() => {
    if (user && user.roles?.some(role => role.name === 'ADMIN') && activeTab === 'links') {
      loadFooterLinks();
    }
  }, [user, currentPage, itemsPerPage, searchQuery, sectionFilter, activeTab]);

  // Load settings khi mở tab settings
  useEffect(() => {
    if (user && user.roles?.some(role => role.name === 'ADMIN') && activeTab === 'settings') {
      loadFooterSettings();
    }
  }, [user, activeTab]);

  // Lấy footer links từ API với phân trang
  const loadFooterLinks = async () => {
    try {
      setLoadingLinks(true);
      setError('');

      const params = {
        page: currentPage - 1, // Backend dùng 0-indexed
        size: itemsPerPage,
        search: searchQuery || undefined,
        section: sectionFilter || undefined,
      };

      const data = await footerApi.getAllFooterLinksPaginated(params);
      setFooterLinks(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách liên kết footer');
    } finally {
      setLoadingLinks(false);
    }
  };

  // Lấy danh sách cài đặt footer
  const loadFooterSettings = async () => {
    try {
      setLoadingSettings(true);
      setError('');
      const data = await footerApi.getAllFooterSettings();
      setFooterSettings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải cấu hình footer');
    } finally {
      setLoadingSettings(false);
    }
  };

  const openCreateLinkModal = () => {
    setEditingLink(null);
    setLinkFormData({
      label: '',
      href: '',
      section: sectionFilter || 'QUICK_LINKS',
      icon: '',
      isActive: true,
      openNewTab: false,
      sortOrder: footerLinks?.length || 0,
    });
    setIsLinkModalOpen(true);
  };

  const openEditLinkModal = (link: FooterLink) => {
    setEditingLink(link);
    setLinkFormData({
      label: link.label,
      href: link.href,
      section: link.section,
      icon: link.icon || '',
      isActive: link.isActive,
      openNewTab: link.openNewTab,
      sortOrder: link.sortOrder,
    });
    setIsLinkModalOpen(true);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLink) {
        const updated = await footerApi.updateFooterLink(editingLink.id, linkFormData as FooterLinkUpdateRequest);
        setFooterLinks(prev => (prev || []).map(item => item.id === editingLink.id ? updated : item));
      } else {
        const created = await footerApi.createFooterLink(linkFormData);
        setFooterLinks(prev => [...(prev || []), created]);
      }

      setIsLinkModalOpen(false);
      setEditingLink(null);
      loadFooterLinks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu liên kết footer');
    }
  };

  const handleLinkDelete = async (link: FooterLink) => {
    if (!confirm(`Bạn có chắc muốn xóa liên kết "${link.label}"?`)) return;

    try {
      await footerApi.deleteFooterLink(link.id);
      setFooterLinks(prev => prev.filter(item => item.id !== link.id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa liên kết footer');
    }
  };

  const openCreateSettingModal = () => {
    setEditingSetting(null);
    setSettingFormData({
      settingKey: '',
      settingValue: '',
      isActive: true,
    });
    setIsSettingModalOpen(true);
  };

  const openEditSettingModal = (setting: FooterSetting) => {
    setEditingSetting(setting);
    setSettingFormData({
      settingKey: setting.settingKey,
      settingValue: setting.settingValue || '',
      isActive: setting.isActive,
    });
    setIsSettingModalOpen(true);
  };

  const handleSettingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSetting) {
        const updated = await footerApi.updateFooterSetting(editingSetting.id, settingFormData as FooterSettingUpdateRequest);
        setFooterSettings(prev => (prev || []).map(item => item.id === editingSetting.id ? updated : item));
      } else {
        const created = await footerApi.createFooterSetting(settingFormData);
        setFooterSettings(prev => [...(prev || []), created]);
      }

      setIsSettingModalOpen(false);
      setEditingSetting(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu cấu hình footer');
    }
  };

  const handleSettingDelete = async (setting: FooterSetting) => {
    if (!confirm(`Bạn có chắc muốn xóa cấu hình "${setting.settingKey}"?`)) return;

    try {
      await footerApi.deleteFooterSetting(setting.id);
      setFooterSettings(prev => prev.filter(item => item.id !== setting.id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa cấu hình footer');
    }
  };

  // Reset về trang 1 khi search/filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sectionFilter]);

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
                🦶 Quản lý Footer
              </h1>
              <p className='mt-2 text-foreground opacity-70'>
                Thêm, sửa, xóa các liên kết và cấu hình hiển thị ở footer
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className='flex gap-2 mb-6 border-b border-accent'>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'links'
                  ? 'bg-accent text-white'
                  : 'text-foreground opacity-70 hover:opacity-100'
              }`}
            >
              🔗 Liên kết footer
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-accent text-white'
                  : 'text-foreground opacity-70 hover:opacity-100'
              }`}
            >
              ⚙️ Cấu hình footer
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
              <p className='text-red-600'>{error}</p>
              <button
                onClick={() => activeTab === 'links' ? loadFooterLinks() : loadFooterSettings()}
                className='mt-2 text-red-700 hover:text-red-800 font-medium'
              >
                Thử lại
              </button>
            </div>
          )}

          {activeTab === 'links' ? (
            <>
              {/* Toolbar */}
              <div className='mb-6 flex flex-col sm:flex-row gap-3'>
                <div className='relative flex-1'>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='🔍 Tìm kiếm theo tên, đường dẫn hoặc người tạo...'
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

                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value as FooterSection | '')}
                  className='px-4 py-3 bg-secondary border border-accent rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent'
                >
                  <option value=''>Tất cả khu vực</option>
                  {ALL_SECTIONS.map(section => (
                    <option key={section} value={section}>
                      {SECTION_EMOJIS[section]} {SECTION_LABELS[section]}
                    </option>
                  ))}
                </select>

                <button
                  onClick={openCreateLinkModal}
                  className='btn-accent font-medium py-2 px-4 rounded-lg transition-colors whitespace-nowrap'
                >
                  + Thêm liên kết
                </button>
              </div>

              {searchQuery && (
                <p className='mt-2 mb-4 text-sm text-foreground opacity-70'>
                  Tìm thấy {totalElements} kết quả
                </p>
              )}

              {/* Items per page selector */}
              {!loadingLinks && footerLinks && footerLinks.length > 0 && (
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
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalElements)} trong tổng số {totalElements} liên kết
                  </div>
                </div>
              )}

              {/* Footer Links Table */}
              <div className='bg-secondary rounded-xl shadow-sm border border-accent overflow-hidden'>
                {loadingLinks ? (
                  <div className='p-8 text-center'>
                    <div className='animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4'></div>
                    <p className='text-foreground opacity-70'>Đang tải...</p>
                  </div>
                ) : footerLinks?.length === 0 ? (
                  <div className='p-8 text-center'>
                    <div className='text-4xl mb-4'>
                      {searchQuery || sectionFilter ? '🔍' : '🔗'}
                    </div>
                    <p className='text-foreground opacity-70 mb-4'>
                      {searchQuery || sectionFilter ? 'Không tìm thấy liên kết nào' : 'Chưa có liên kết nào'}
                    </p>
                    {!searchQuery && !sectionFilter && (
                      <button
                        onClick={openCreateLinkModal}
                        className='btn-accent font-medium py-2 px-4 rounded-lg'
                      >
                        Tạo liên kết đầu tiên
                      </button>
                    )}
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-primary border-b border-accent'>
                        <tr>
                          <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                            Liên kết
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                            Khu vực
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                            Đường dẫn
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
                        {footerLinks?.filter(item => item).map((link) => (
                          <tr key={link.id} className='hover:bg-primary transition-colors'>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='flex items-center'>
                                <span className='text-lg mr-2'>{link.icon || '🔗'}</span>
                                <span className='text-sm font-medium text-foreground'>
                                  {link.label}
                                </span>
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                              <span className='inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary border border-accent'>
                                {SECTION_EMOJIS[link.section]} {SECTION_LABELS[link.section]}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground opacity-70'>
                              <a
                                href={link.href}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-accent hover:text-highlight transition-colors'
                              >
                                {link.href}
                              </a>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                              {link.openNewTab ? '✅' : '❌'}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                link.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {link.isActive ? 'Hiển thị' : 'Ẩn'}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                              {link.sortOrder}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                              <div className='flex space-x-2'>
                                <button
                                  onClick={() => openEditLinkModal(link)}
                                  className='text-accent hover:text-highlight transition-colors'
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleLinkDelete(link)}
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
              {!loadingLinks && footerLinks && footerLinks.length > 0 && totalPages > 1 && (
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
            </>
          ) : (
            <>
              {/* Settings toolbar */}
              <div className='mb-6 flex justify-end'>
                <button
                  onClick={openCreateSettingModal}
                  className='btn-accent font-medium py-2 px-4 rounded-lg transition-colors whitespace-nowrap'
                >
                  + Thêm cấu hình
                </button>
              </div>

              {/* Footer Settings Table */}
              <div className='bg-secondary rounded-xl shadow-sm border border-accent overflow-hidden'>
                {loadingSettings ? (
                  <div className='p-8 text-center'>
                    <div className='animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4'></div>
                    <p className='text-foreground opacity-70'>Đang tải...</p>
                  </div>
                ) : footerSettings?.length === 0 ? (
                  <div className='p-8 text-center'>
                    <div className='text-4xl mb-4'>⚙️</div>
                    <p className='text-foreground opacity-70 mb-4'>Chưa có cấu hình nào</p>
                    <button
                      onClick={openCreateSettingModal}
                      className='btn-accent font-medium py-2 px-4 rounded-lg'
                    >
                      Tạo cấu hình đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-primary border-b border-accent'>
                        <tr>
                          <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                            Khóa
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                            Giá trị
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                            Trạng thái
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider'>
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-accent'>
                        {footerSettings?.filter(item => item).map((setting) => (
                          <tr key={setting.id} className='hover:bg-primary transition-colors'>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span className='px-2 py-1 text-xs font-mono bg-primary border border-accent rounded'>
                                {setting.settingKey}
                              </span>
                            </td>
                            <td className='px-6 py-4 text-sm text-foreground opacity-80 max-w-md'>
                              <p className='truncate'>{setting.settingValue || '-'}</p>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                setting.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {setting.isActive ? 'Hoạt động' : 'Tắt'}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                              <div className='flex space-x-2'>
                                <button
                                  onClick={() => openEditSettingModal(setting)}
                                  className='text-accent hover:text-highlight transition-colors'
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleSettingDelete(setting)}
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
            </>
          )}
        </div>
      </div>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='bg-primary rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b border-accent'>
              <h2 className='text-xl font-semibold text-foreground'>
                {editingLink ? '✏️ Sửa liên kết' : '➕ Thêm liên kết'}
              </h2>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className='text-foreground hover:text-accent transition-colors'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Khu vực hiển thị *
                </label>
                <select
                  value={linkFormData.section}
                  onChange={(e) => setLinkFormData({ ...linkFormData, section: e.target.value as FooterSection })}
                  className='auth-input'
                  required
                >
                  {ALL_SECTIONS.map(section => (
                    <option key={section} value={section}>
                      {SECTION_EMOJIS[section]} {SECTION_LABELS[section]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Tên hiển thị *
                </label>
                <input
                  type='text'
                  value={linkFormData.label}
                  onChange={(e) => setLinkFormData({ ...linkFormData, label: e.target.value })}
                  className='auth-input'
                  placeholder='VD: Trang chủ'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Đường dẫn (href) *
                </label>
                <input
                  type='text'
                  value={linkFormData.href}
                  onChange={(e) => setLinkFormData({ ...linkFormData, href: e.target.value })}
                  className='auth-input'
                  placeholder='VD: /news hoặc https://facebook.com/...'
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
                    value={linkFormData.icon}
                    onChange={(e) => setLinkFormData({ ...linkFormData, icon: e.target.value })}
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
                    value={linkFormData.sortOrder}
                    onChange={(e) => setLinkFormData({ ...linkFormData, sortOrder: parseInt(e.target.value) || 0 })}
                    className='auth-input'
                    min='0'
                  />
                </div>
              </div>

              <div className='flex items-center gap-6'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='linkIsActive'
                    checked={linkFormData.isActive}
                    onChange={(e) => setLinkFormData({ ...linkFormData, isActive: e.target.checked })}
                    className='h-4 w-4 text-accent focus:ring-accent border-accent rounded'
                  />
                  <label htmlFor='linkIsActive' className='ml-2 block text-sm text-foreground'>
                    Hiển thị trên footer
                  </label>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='linkOpenNewTab'
                    checked={linkFormData.openNewTab}
                    onChange={(e) => setLinkFormData({ ...linkFormData, openNewTab: e.target.checked })}
                    className='h-4 w-4 text-accent focus:ring-accent border-accent rounded'
                  />
                  <label htmlFor='linkOpenNewTab' className='ml-2 block text-sm text-foreground'>
                    Mở tab mới
                  </label>
                </div>
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setIsLinkModalOpen(false)}
                  className='flex-1 px-4 py-2 border border-accent text-foreground rounded-lg hover:bg-secondary transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='flex-1 btn-accent px-4 py-2 rounded-lg transition-colors'
                >
                  {editingLink ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Setting Modal */}
      {isSettingModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='bg-primary rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b border-accent'>
              <h2 className='text-xl font-semibold text-foreground'>
                {editingSetting ? '✏️ Sửa cấu hình' : '➕ Thêm cấu hình'}
              </h2>
              <button
                onClick={() => setIsSettingModalOpen(false)}
                className='text-foreground hover:text-accent transition-colors'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSettingSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Khóa cấu hình *
                </label>
                <input
                  type='text'
                  value={settingFormData.settingKey}
                  onChange={(e) => setSettingFormData({ ...settingFormData, settingKey: e.target.value })}
                  className='auth-input'
                  placeholder='VD: brand_description, copyright_text'
                  required
                />
                <p className='mt-1 text-xs text-foreground opacity-50'>
                  Chỉ chứa chữ thường, số và dấu gạch dưới
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Giá trị
                </label>
                <textarea
                  value={settingFormData.settingValue}
                  onChange={(e) => setSettingFormData({ ...settingFormData, settingValue: e.target.value })}
                  className='auth-input min-h-[100px]'
                  placeholder='VD: Nền tảng chia sẻ video hàng đầu Việt Nam...'
                  rows={4}
                />
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='settingIsActive'
                  checked={settingFormData.isActive}
                  onChange={(e) => setSettingFormData({ ...settingFormData, isActive: e.target.checked })}
                  className='h-4 w-4 text-accent focus:ring-accent border-accent rounded'
                />
                <label htmlFor='settingIsActive' className='ml-2 block text-sm text-foreground'>
                  Đang hoạt động
                </label>
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setIsSettingModalOpen(false)}
                  className='flex-1 px-4 py-2 border border-accent text-foreground rounded-lg hover:bg-secondary transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='flex-1 btn-accent px-4 py-2 rounded-lg transition-colors'
                >
                  {editingSetting ? 'Cập nhật' : 'Tạo mới'}
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
