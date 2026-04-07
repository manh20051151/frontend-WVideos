'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import { authApi } from '@/lib/apis/auth.api';
import { uploadImageToImgbb } from '@/lib/utils/imgbb';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const MENU_ITEMS = [
  { id: 'info', label: 'Thông tin cá nhân', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'password', label: 'Đổi mật khẩu', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const { isDark } = useDarkMode();

  const [selectedMenu, setSelectedMenu] = useState<string>('info');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<{ fullName: string; numberPhone: string; avatar: string; gender: boolean | null; bankName: string; bankAccountHolderName: string; bankAccountNumber: string }>({
    fullName: '',
    numberPhone: '',
    avatar: '',
    gender: null,
    bankName: '',
    bankAccountHolderName: '',
    bankAccountNumber: '',
  });
  const [passwordData, setPasswordData] = useState<{ passwordOld: string; passwordNew: string; confirmPassword: string }>({
    passwordOld: '',
    passwordNew: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState<{ old: boolean; new: boolean; confirm: boolean }>({
    old: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [banks, setBanks] = useState<Array<{ code: string; name: string; shortName: string; logo: string }>>([]);
  const [banksLoading, setBanksLoading] = useState<boolean>(false);
  const [bankSearch, setBankSearch] = useState<string>('');
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && MENU_ITEMS.find(item => item.id === tab)) {
      setSelectedMenu(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        numberPhone: user.numberPhone || '',
        avatar: user.avatar || '',
        gender: user.gender ?? null,
        bankName: user.bankName || '',
        bankAccountHolderName: user.bankAccountHolderName || '',
        bankAccountNumber: user.bankAccountNumber || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchBanks = async () => {
      setBanksLoading(true);
      try {
        const response = await authApi.getBankList();
        if (response.code === '00' && response.data) {
          setBanks(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách ngân hàng:', error);
      } finally {
        setBanksLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const handleMenuClick = useCallback((menuId: string) => {
    setSelectedMenu(menuId);
    setError('');
    setSuccess('');
    setIsEditing(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (selectedMenu === 'password') {
      setPasswordData((prev: { passwordOld: string; passwordNew: string; confirmPassword: string }) => ({ ...prev, [name]: value }));
    } else {
      if (name === 'gender') {
        setFormData((prev) => ({ ...prev, gender: value === 'true' ? true : value === 'false' ? false : null }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
    setError('');
    setSuccess('');
  }, [selectedMenu]);

  const handleGenderChange = useCallback((value: boolean | null) => {
    setFormData(prev => ({ ...prev, gender: value }));
    setError('');
    setSuccess('');
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!formData.fullName.trim()) {
      setError('Họ tên không được để trống');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await authApi.updateProfile({
        fullName: formData.fullName,
        numberPhone: formData.numberPhone,
        avatar: formData.avatar,
        gender: formData.gender ?? undefined,
        bankName: formData.bankName || undefined,
        bankAccountHolderName: formData.bankAccountHolderName || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
      });
      await refreshProfile();
      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, refreshProfile]);

  const handleSavePassword = useCallback(async () => {
    if (!passwordData.passwordOld) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (passwordData.passwordNew.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordData.passwordNew !== passwordData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await authApi.changePassword({
        passwordOld: passwordData.passwordOld,
        passwordNew: passwordData.passwordNew,
      });
      setSuccess('Đổi mật khẩu thành công!');
      setPasswordData({ passwordOld: '', passwordNew: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  }, [passwordData]);

  const handleCancel = useCallback(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        numberPhone: user.numberPhone || '',
        avatar: user.avatar || '',
        gender: user.gender ?? null,
        bankName: user.bankName || '',
        bankAccountHolderName: user.bankAccountHolderName || '',
        bankAccountNumber: user.bankAccountNumber || '',
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="animate-pulse max-w-2xl mx-auto py-12 px-4">
          <div className="h-32 bg-secondary rounded-full w-32 mx-auto mb-6"></div>
          <div className="h-8 bg-secondary rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-secondary rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info Card */}
            <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`p-6 text-center border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="relative inline-block">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-accent mx-auto" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold mx-auto">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{user.fullName || user.username}</h3>
                <p className="text-sm text-foreground opacity-60">{user.email}</p>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center py-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Số dư</span>
                  <span className="font-semibold text-green-600">0 đ</span>
                </div>
              </div>
            </div>

            {/* Menu Card */}
            <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-4">
                <nav className="space-y-1">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        selectedMenu === item.id ? 'bg-accent text-white' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <h4 className="font-semibold text-foreground">Thống kê nhanh</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Video đã tải lên</span>
                  <span className="font-semibold text-foreground">0</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Lượt xem</span>
                  <span className="font-semibold text-foreground">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className={`rounded-2xl shadow-lg border overflow-visible ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-bold text-foreground">
                    {MENU_ITEMS.find(m => m.id === selectedMenu)?.label}
                  </h1>
                  {selectedMenu === 'info' && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent/80 transition-colors">
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>

                <div className="p-6">
                {selectedMenu === 'info' && (
                  <div className="space-y-6">
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group">
                          {formData.avatar ? (
                            <div className="relative">
                              <img src={formData.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-accent" />
                              {isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer group-hover:bg-black/60 transition-colors">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setAvatarUploading(true);
                                        setError('');
                                        const result = await uploadImageToImgbb(file);
                                        if (result.success && result.data?.url) {
                                          setFormData(prev => ({ ...prev, avatar: result.data!.url }));
                                        } else {
                                          setError(result.error || 'Upload ảnh thất bại');
                                        }
                                        setAvatarUploading(false);
                                      }
                                    }}
                                    className="hidden"
                                    disabled={avatarUploading}
                                  />
                                  {avatarUploading ? (
                                    <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  )}
                                </label>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-white text-3xl font-bold">
                                {user.username?.charAt(0).toUpperCase()}
                              </div>
                              {isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer group-hover:bg-black/60 transition-colors">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setAvatarUploading(true);
                                        setError('');
                                        const result = await uploadImageToImgbb(file);
                                        if (result.success && result.data?.url) {
                                          setFormData(prev => ({ ...prev, avatar: result.data!.url }));
                                        } else {
                                          setError(result.error || 'Upload ảnh thất bại');
                                        }
                                        setAvatarUploading(false);
                                      }
                                    }}
                                    className="hidden"
                                    disabled={avatarUploading}
                                  />
                                  {avatarUploading ? (
                                    <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  )}
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-center sm:text-left flex-1">
                          <h3 className="text-lg font-semibold text-foreground">{user.fullName || 'Chưa cập nhật'}</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                        <input type="email" value={user.email || ''} disabled
                          className={`w-full px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Họ tên <span className="text-red-500">*</span></label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={!isEditing}
                          className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''} ${error && !formData.fullName ? 'border-red-500' : ''}`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Số điện thoại</label>
                        <input type="text" name="numberPhone" value={formData.numberPhone} onChange={handleInputChange} disabled={!isEditing}
                          className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''}`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Giới tính</label>
                        {isEditing ? (
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="gender" checked={formData.gender === true} onChange={() => handleGenderChange(true)}
                                className="w-4 h-4 text-accent" />
                              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Nam</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="gender" checked={formData.gender === false} onChange={() => handleGenderChange(false)}
                                className="w-4 h-4 text-accent" />
                              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Nữ</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="gender" checked={formData.gender === null} onChange={() => handleGenderChange(null)}
                                className="w-4 h-4 text-accent" />
                              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Khác</span>
                            </label>
                          </div>
                        ) : (
                          <input type="text" value={user.gender === true ? 'Nam' : user.gender === false ? 'Nữ' : 'Khác'} disabled
                            className={`w-full px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
                        )}
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ngày tham gia</label>
                        <input type="text" value={user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('vi-VN') : 'Chưa rõ'} disabled
                          className={`w-full px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ngân hàng</label>
                        {isEditing ? (
                          <div className="relative">
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                {formData.bankName && banks.find(b => b.code === formData.bankName)?.logo ? (
                                  <img
                                    src={banks.find(b => b.code === formData.bankName)?.logo}
                                    alt="Bank logo"
                                    className="w-6 h-6 object-contain"
                                  />
                                ) : (
                                  <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                )}
                              </div>
                              <input
                                type="text"
                                value={formData.bankName ? banks.find(b => b.code === formData.bankName)?.shortName + ' - ' + banks.find(b => b.code === formData.bankName)?.name : bankSearch}
                                onChange={(e) => {
                                  setBankSearch(e.target.value);
                                  const dropdown = document.getElementById('bank-dropdown');
                                  if (!dropdown || dropdown.classList.contains('hidden')) {
                                    dropdown?.classList.remove('hidden');
                                  }
                                }}
                                onFocus={() => document.getElementById('bank-dropdown')?.classList.remove('hidden')}
                                placeholder="Tìm kiếm ngân hàng..."
                                className={`w-full pl-10 pr-10 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-700'}`}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            <div id="bank-dropdown" className={`hidden absolute z-50 w-full mt-1 rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                              <div className="max-h-64 overflow-auto">
                                {banks
                                  .filter(bank => !bankSearch || bank.name.toLowerCase().includes(bankSearch.toLowerCase()) || bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()))
                                  .map((bank) => (
                                    <button
                                      key={bank.code}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, bankName: bank.code }));
                                        setBankSearch('');
                                        document.getElementById('bank-dropdown')?.classList.add('hidden');
                                      }}
                                      className={`w-full px-4 py-3 flex items-center gap-3 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-700'} ${formData.bankName === bank.code ? 'bg-accent/10' : ''}`}
                                    >
                                      <img src={bank.logo} alt={bank.shortName} className="w-10 h-10 object-contain" />
                                      <span className="text-sm">{bank.shortName} - {bank.name}</span>
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {user.bankName && banks.find(b => b.code === user.bankName)?.logo && (
                              <img
                                src={banks.find(b => b.code === user.bankName)?.logo}
                                alt="Bank logo"
                                className="w-8 h-8 object-contain rounded"
                              />
                            )}
                            <input
                              type="text"
                              value={banks.find(b => b.code === user.bankName)?.name || user.bankName || 'Chưa cập nhật'}
                              disabled
                              className={`flex-1 px-4 py-3 rounded-lg border cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tên chủ tài khoản</label>
                        <input type="text" name="bankAccountHolderName" value={formData.bankAccountHolderName} onChange={handleInputChange} disabled={!isEditing} placeholder="Tên chủ tài khoản"
                          className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''}`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Số tài khoản</label>
                        <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleInputChange} disabled={!isEditing} placeholder="Số tài khoản"
                          className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'cursor-not-allowed' : ''}`} />
                      </div>
                    </div>

                    {error && <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">{error}</div>}
                    {success && <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">{success}</div>}

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <button onClick={handleCancel} disabled={isSaving}
                          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} disabled:opacity-50`}>
                          Hủy
                        </button>
                        <button onClick={handleSaveProfile} disabled={isSaving}
                          className="flex-1 px-6 py-3 rounded-lg font-medium bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50">
                          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedMenu === 'password' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input 
                          type={showPassword.old ? 'text' : 'password'} 
                          name="passwordOld" 
                          value={passwordData.passwordOld} 
                          onChange={handleInputChange}
                          placeholder="Nhập mật khẩu hiện tại"
                          className={`w-full px-4 py-3 pr-10 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, old: !prev.old }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword.old ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.414 5.135m-5.613-5.613L19.07 19.07" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mật khẩu mới</label>
                      <div className="relative">
                        <input 
                          type={showPassword.new ? 'text' : 'password'} 
                          name="passwordNew" 
                          value={passwordData.passwordNew} 
                          onChange={handleInputChange}
                          placeholder="Nhập mật khẩu mới"
                          className={`w-full px-4 py-3 pr-10 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword.new ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.414 5.135m-5.613-5.613L19.07 19.07" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <input 
                          type={showPassword.confirm ? 'text' : 'password'} 
                          name="confirmPassword" 
                          value={passwordData.confirmPassword} 
                          onChange={handleInputChange}
                          placeholder="Nhập lại mật khẩu mới"
                          className={`w-full px-4 py-3 pr-10 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword.confirm ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.414 5.135m-5.613-5.613L19.07 19.07" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      {error && <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">{error}</div>}
                      {success && <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">{success}</div>}
                    </div>
                    <div className="md:col-span-2">
                      <button onClick={handleSavePassword} disabled={isSaving}
                        className="w-full px-6 py-3 rounded-lg font-medium bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50">
                        {isSaving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileLoading() {
  const { isDark } = useDarkMode();
  return (
    <div className="min-h-screen bg-primary py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="animate-pulse">
                <div className="h-20 w-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-48 mx-auto"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="animate-pulse h-8 bg-gray-300 rounded w-48 mb-6"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-300 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<ProfileLoading />}>
        <ProfileContent />
      </Suspense>
      <Footer />
    </>
  );
}