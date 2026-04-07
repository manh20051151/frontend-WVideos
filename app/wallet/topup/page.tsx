'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import { getFinancialInfo, checkTransactionWithAmount } from '@/lib/apis/wallet.api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientOnly from '@/components/common/ClientOnly';

const BANK_INFO = {
  acc: '101499100004219855',
  bank: 'KienLongBank',
  name: 'NGUYEN VIET MANH'
};

const QR_TIMEOUT = 5 * 60 * 1000;
const SUGGESTED_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function TopUpPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useDarkMode();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState('');
  const [isCheckingTransaction, setIsCheckingTransaction] = useState(false);
  const [transactionFound, setTransactionFound] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const getUserId = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const userId = userData.id || '';
        return userId.replace(/-/g, '');
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return '';
  }, []);

  const generateTransactionId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateQRCode = (amount: number, transactionId: string) => {
    const userId = getUserId();
    const baseUrl = 'https://qr.sepay.vn/img';
    const params = new URLSearchParams({
      acc: BANK_INFO.acc,
      bank: BANK_INFO.bank,
      amount: amount.toString(),
      des: `NAPTIEN${transactionId}${userId}`,
      template: 'compact'
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const loadFinancialInfo = useCallback(async () => {
    try {
      setBalanceLoading(true);
      setBalanceError('');
      const response = await getFinancialInfo();
      let balanceValue = 0;
      if (response && typeof response === 'object') {
        if ('balance' in response) {
          balanceValue = (response as any).balance || 0;
        } else if ('result' in response && response.result) {
          balanceValue = (response as any).result.balance || 0;
        }
      }
      setBalance(balanceValue);
    } catch (error: any) {
      console.error('Error loading financial info:', error);
      setBalance(0);
      if (error.response?.status === 401) {
        setBalanceError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setBalanceError('Không thể kết nối đến server. Vui lòng thử lại sau.');
      }
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      setBalanceError('');
      const response = await getFinancialInfo();
      let balanceValue = 0;
      if (response && typeof response === 'object') {
        if ('balance' in response) {
          balanceValue = (response as any).balance || 0;
        } else if ('result' in response && response.result) {
          balanceValue = (response as any).result.balance || 0;
        }
      }
      setBalance(balanceValue);
    } catch (error: any) {
      console.error('Error refreshing balance:', error);
      if (error.response?.status === 401) {
        setBalanceError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setBalanceError('Không thể cập nhật số dư. Vui lòng thử lại sau.');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFinancialInfo();
    }
  }, [user, loadFinancialInfo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQRDialog && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsExpired(true);
            setTimeout(() => {
              setShowQRDialog(false);
            }, 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQRDialog, timeLeft]);

  useEffect(() => {
    if (showQRDialog && !isExpired && !transactionFound) {
      setIsCheckingTransaction(true);
      checkTransaction();
      
      const interval = setInterval(() => {
        if (!transactionFound && !isExpired) {
          checkTransaction();
        }
      }, 8000);
      
      setPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
        setPollingInterval(null);
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setIsCheckingTransaction(false);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [showQRDialog, isExpired, transactionFound, transactionId, amount]);

  const checkTransaction = async () => {
    if (!transactionId || !amount) return;
    
    try {
      const userId = getUserId();
      const description = `NAPTIEN${transactionId}${userId}`;
      const response = await checkTransactionWithAmount(description, parseInt(amount));
      
      // Response is the result field from ApiResponse - could be "FOUND" or "NOT_FOUND"
      const resultValue = (response as any)?.result ?? response;
      if (resultValue === 'FOUND') {
        setTransactionFound(true);
        setIsCheckingTransaction(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        await refreshBalance();
      }
    } catch (error) {
      console.error('Error checking transaction:', error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
    setError('');
  };

  const handleSuggestedAmount = (suggestedAmount: number) => {
    setAmount(suggestedAmount.toString());
    setError('');
  };

  const handleAmountAdjust = (adjustment: number) => {
    const currentAmount = parseInt(amount || '0');
    const newAmount = Math.max(0, currentAmount + adjustment);
    setAmount(newAmount.toString());
    setError('');
  };

  const validateAmount = () => {
    const numAmount = parseInt(amount);
    
    if (!amount || numAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return false;
    }
    
    if (numAmount < 2000) {
      setError('Số tiền nạp tối thiểu là 10.000 VNĐ');
      return false;
    }
    
    if (numAmount > 50000000) {
      setError('Số tiền nạp tối đa là 50.000.000 VNĐ');
      return false;
    }
    
    return true;
  };

  const handleTopUp = () => {
    if (!validateAmount()) return;
    
    const newTransactionId = generateTransactionId();
    const qrCodeUrl = generateQRCode(parseInt(amount), newTransactionId);
    
    setTransactionId(newTransactionId);
    setQrCode(qrCodeUrl);
    setTimeLeft(QR_TIMEOUT / 1000);
    setIsExpired(false);
    setTransactionFound(false);
    setIsCheckingTransaction(false);
    setShowQRDialog(true);
  };

  const handleCopyTransactionId = async () => {
    try {
      const userId = getUserId();
      const textToCopy = `NAPTIEN${transactionId}${userId}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-secure context
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRefreshQR = () => {
    const newTransactionId = generateTransactionId();
    const qrCodeUrl = generateQRCode(parseInt(amount), newTransactionId);
    
    setTransactionId(newTransactionId);
    setQrCode(qrCodeUrl);
    setTimeLeft(QR_TIMEOUT / 1000);
    setIsExpired(false);
    setTransactionFound(false);
    setIsCheckingTransaction(false);
  };

  const handleCloseQRDialog = () => {
    setShowQRDialog(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsCheckingTransaction(false);
    setTransactionFound(false);
    refreshBalance();
  };

  if (!user && !authLoading) {
    return (
      <ClientOnly fallback={
        <>
          <Header />
          <div className='min-h-screen bg-primary py-12 px-4'>
            <div className='max-w-5xl mx-auto'>
              <div className='animate-pulse'>
                <div className='h-8 bg-secondary rounded w-64 mb-4'></div>
                <div className='h-4 bg-secondary rounded w-96 mb-8'></div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='md:col-span-2 h-96 bg-secondary rounded-xl'></div>
                  <div className='h-96 bg-secondary rounded-xl'></div>
                </div>
              </div>
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
      <div className='min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-5xl mx-auto'>
          <button
            onClick={() => router.back()}
            className='mb-4 flex items-center gap-2 text-foreground opacity-70 hover:opacity-100 transition-opacity'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            Quay lại
          </button>

          <div className='flex items-center gap-3 mb-8'>
            <svg className='w-10 h-10 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' />
            </svg>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>Nạp tiền vào ví</h1>
              <p className='text-foreground opacity-70'>Nạp tiền nhanh chóng và an toàn bằng QR Code</p>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
              <div className={`rounded-2xl shadow-xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className='p-4 mb-6 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white text-center'>
                  <p className='text-sm opacity-80 mb-1'>Số dư hiện tại</p>
                  {balanceLoading ? (
                    <div className='animate-pulse h-10 bg-white/20 rounded w-48 mx-auto'></div>
                  ) : (
                    <p className='text-3xl font-bold'>{formatCurrency(balance)}</p>
                  )}
                  {balanceError && (
                    <div className='mt-2'>
                      <p className='text-sm text-red-200'>{balanceError}</p>
                      <button 
                        onClick={refreshBalance}
                        className='mt-2 text-sm px-3 py-1 border border-white/50 rounded hover:bg-white/10 transition-colors'
                      >
                        Thử lại
                      </button>
                    </div>
                  )}
                </div>

                <div className='mb-6'>
                  <h2 className='text-lg font-semibold text-foreground mb-3'>Số tiền muốn nạp</h2>
                  <div className={`flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                    <button
                      onClick={() => handleAmountAdjust(-10000)}
                      disabled={parseInt(amount || '0') <= 0}
                      className='px-4 py-3 text-foreground opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 12H4' />
                      </svg>
                    </button>
                    <input
                      type='text'
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder='0'
                      className={`flex-1 text-center text-xl font-semibold py-3 bg-transparent outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
                    />
                    <button
                      onClick={() => handleAmountAdjust(10000)}
                      className='px-4 py-3 text-foreground opacity-70 hover:opacity-100 transition-opacity'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                      </svg>
                    </button>
                    <span className='px-4 text-foreground opacity-60'>VNĐ</span>
                  </div>
                  {error && <p className='mt-2 text-sm text-red-500'>{error}</p>}
                  {amount && (
                    <p className='mt-1 text-right text-sm text-teal-500 font-semibold'>
                      {formatCurrency(parseInt(amount))}
                    </p>
                  )}
                </div>

                <div className='mb-6'>
                  <h3 className='text-base font-semibold text-foreground mb-3'>Chọn nhanh</h3>
                  <div className='flex flex-wrap gap-2'>
                    {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
                      <button
                        key={suggestedAmount}
                        onClick={() => handleSuggestedAmount(suggestedAmount)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          parseInt(amount) === suggestedAmount
                            ? 'bg-teal-500 text-white'
                            : isDark
                              ? 'border border-gray-600 text-foreground hover:bg-gray-700'
                              : 'border border-gray-300 text-foreground hover:bg-gray-100'
                        }`}
                      >
                        {formatCurrency(suggestedAmount)}
                      </button>
                    ))}
                  </div>
                </div>

                {amount && parseInt(amount) >= 2000 && (
                  <div className={`p-4 mb-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className='text-base font-semibold text-foreground mb-3'>Tóm tắt giao dịch</h3>
                    <div className='flex justify-between mb-2'>
                      <span className='text-foreground opacity-70'>Số tiền nạp:</span>
                      <span className='font-semibold text-teal-500'>{formatCurrency(parseInt(amount))}</span>
                    </div>
                    <div className='flex justify-between mb-2'>
                      <span className='text-foreground opacity-70'>Phí giao dịch:</span>
                      <span className='font-semibold text-green-500'>Miễn phí</span>
                    </div>
                    <div className={`flex justify-between pt-3 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <span className='font-semibold text-foreground'>Tổng tiền nhận:</span>
                      <span className='font-bold text-lg text-teal-500'>{formatCurrency(parseInt(amount))}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleTopUp}
                  disabled={!amount || parseInt(amount) < 2000 || loading}
                  className='w-full py-3 px-6 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' />
                  </svg>
                  Tạo mã QR thanh toán
                </button>
              </div>
            </div>

            <div className='space-y-4'>
              <div className={`rounded-2xl shadow-xl p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className='flex items-center gap-2 mb-3'>
                  <svg className='w-5 h-5 text-teal-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' />
                  </svg>
                  <h3 className='text-base font-semibold text-foreground'>Phương thức thanh toán</h3>
                </div>
                <div className={`p-4 border-2 border-teal-500 rounded-xl text-center ${isDark ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
                  <svg className='w-10 h-10 text-teal-500 mx-auto mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' />
                  </svg>
                  <p className='font-semibold text-teal-500'>Chuyển khoản QR Code</p>
                  <p className='text-sm text-foreground opacity-70 mt-1'>Nhanh chóng • An toàn • Tiện lợi</p>
                </div>
              </div>

              <div className={`rounded-2xl shadow-xl p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className='flex items-center gap-2 mb-3'>
                  <svg className='w-5 h-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                  </svg>
                  <h3 className='text-base font-semibold text-foreground'>Bảo mật và An toàn</h3>
                </div>
                <div className='space-y-3'>
                  <div className='flex items-start gap-2'>
                    <svg className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    <p className='text-sm text-foreground'>Mã QR có thời hạn 5 phút đảm bảo bảo mật</p>
                  </div>
                  <div className='flex items-start gap-2'>
                    <svg className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    <p className='text-sm text-foreground'>Giao dịch được mã hóa SSL 256-bit</p>
                  </div>
                  <div className='flex items-start gap-2'>
                    <svg className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    <p className='text-sm text-foreground'>Tiền được nạp ngay sau khi chuyển khoản thành công</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl shadow-xl p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className='flex items-center gap-2 mb-3'>
                  <svg className='w-5 h-5 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <h3 className='text-base font-semibold text-foreground'>Hỗ trợ</h3>
                </div>
                <div className='space-y-2 text-sm text-foreground'>
                  <p>Hotline/Zalo: 0375000169</p>
                  <p>Email: admin@wvideos.com</p>
                  <p>Thời gian: 8:00 - 22:00 hàng ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showQRDialog && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden' onClick={handleCloseQRDialog}>
            <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' />
            <div
              className={`relative rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-xl md:max-w-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-6 py-4 border-b rounded-t-2xl ${
                transactionFound 
                  ? 'bg-green-100 text-green-800' 
                  : isExpired 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-teal-100 text-teal-800'
              }`}>
                <div className='flex items-center gap-2'>
                  {transactionFound ? (
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  ) : isExpired ? (
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                    </svg>
                  ) : (
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' />
                    </svg>
                  )}
                  <h3 className='text-lg font-semibold'>
                    {transactionFound ? 'Thanh toán thành công!' : isExpired ? 'Mã QR đã hết hạn' : 'Quét mã QR để thanh toán'}
                  </h3>
                </div>
                {!isExpired && (
                  <div className='flex items-center gap-1'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <span className='font-semibold'>{formatTimeLeft(timeLeft)}</span>
                  </div>
                )}
              </div>

              <div className='p-6 text-center'>
                {transactionFound ? (
                  <div className='py-4'>
                    <svg className='w-20 h-20 text-green-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <h4 className='text-xl font-semibold text-green-500 mb-2'>Thanh toán thành công!</h4>
                    <p className='text-foreground opacity-70 mb-4'>
                      Số tiền {formatCurrency(parseInt(amount))} đã được nạp vào tài khoản của bạn.
                    </p>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                      <p className='text-sm text-green-600'>Giao dịch đã được xử lý thành công. Số dư của bạn đã được cập nhật.</p>
                    </div>
                  </div>
                ) : !isExpired ? (
                  <>
                    <div className='mb-4 pt-2'>
                      <img
                        src={qrCode}
                        alt='QR Code'
                        className='w-64 h-64 mx-auto border rounded-xl'
                        style={{ borderColor: isDark ? '#374151' : '#e0e0e0' }}
                      />
                    </div>

                    <div className={`p-4 mb-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h4 className='text-base font-semibold text-foreground mb-3'>Thông tin chuyển khoản</h4>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-foreground opacity-70'>Số tài khoản:</span>
                          <span className='font-semibold text-foreground'>{BANK_INFO.acc}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-foreground opacity-70'>Ngân hàng:</span>
                          <span className='font-semibold text-foreground'>{BANK_INFO.bank}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-foreground opacity-70'>Chủ tài khoản:</span>
                          <span className='font-semibold text-foreground'>{BANK_INFO.name}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-foreground opacity-70'>Số tiền:</span>
                          <span className='font-semibold text-teal-500'>{formatCurrency(parseInt(amount))}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-foreground opacity-70'>Nội dung:</span>
                          <div className='flex items-center gap-1'>
                            <span className='font-semibold text-foreground'>
                              NAPTIEN{transactionId}{getUserId()}
                            </span>
                            <button
                              onClick={handleCopyTransactionId}
                              className='p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors'
                            >
                              <svg className='w-4 h-4 text-foreground opacity-70' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 mb-3 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                      <div className='flex items-start gap-2'>
                        <svg className='w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <p className='text-sm text-blue-600 text-left'>
                          1. Mở ứng dụng ngân hàng của bạn<br/>
                          2. Quét mã QR hoặc chuyển khoản thủ công<br/>
                          3. Kiểm tra thông tin và xác nhận thanh toán<br/>
                          4. Tiền sẽ được nạp vào tài khoản sau khi thanh toán thành công
                        </p>
                      </div>
                    </div>

                    <div className={`p-3 mb-3 rounded-xl ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                      <p className='text-sm text-yellow-600 font-semibold'>
                        Lưu ý: Mã QR sẽ hết hạn sau {formatTimeLeft(timeLeft)}. Vui lòng hoàn tất giao dịch trước khi hết hạn.
                      </p>
                    </div>

                    {isCheckingTransaction && (
                      <div className='flex items-center justify-center gap-2 mt-2'>
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500' />
                        <span className='text-sm text-foreground opacity-70'>Đang kiểm tra giao dịch...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className='py-4'>
                    <svg className='w-20 h-20 text-red-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                    </svg>
                    <h4 className='text-xl font-semibold text-red-500 mb-2'>Mã QR đã hết hạn</h4>
                    <p className='text-foreground opacity-70 mb-4'>
                      Mã QR chỉ có hiệu lực trong 5 phút. Bạn sẽ được chuyển về trang chủ.
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className='px-6 py-2 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors'
                    >
                      Về trang chủ
                    </button>
                  </div>
                )}
              </div>

              <div className={`flex justify-between px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {transactionFound ? (
                  <button
                    onClick={handleCloseQRDialog}
                    className='w-full py-2 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors'
                  >
                    Đóng
                  </button>
                ) : !isExpired ? (
                  <>
                    <button
                      onClick={handleRefreshQR}
                      className='px-4 py-2 text-foreground opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                      </svg>
                      Tạo mã mới
                    </button>
                    <button
                      onClick={handleCloseQRDialog}
                      className='px-6 py-2 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors'
                    >
                      Đóng
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => router.push('/')}
                    className='w-full py-2 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors'
                  >
                    Về trang chủ
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
