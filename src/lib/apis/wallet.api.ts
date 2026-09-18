import axiosClient from './axiosClient';

const WALLET_ENDPOINT = 'users';

const getUserId = () => {
  const user = localStorage.getItem('user');
  if (!user) {
    throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
  }
  
  try {
    const userData = JSON.parse(user);
    const userId = userData.id;
    
    if (!userId) {
      throw new Error('Không tìm thấy ID người dùng.');
    }
    
    return userId;
  } catch (parseError) {
    throw new Error('Dữ liệu người dùng không hợp lệ. Vui lòng đăng nhập lại.');
  }
};

export const getFinancialInfo = async () => {
  const userId = getUserId();
  return axiosClient.get(`${WALLET_ENDPOINT}/${userId}/financial-info`);
};

// ===== Lịch sử biến động tài chính cá nhân =====
export interface FinancialEvent {
  id: string;
  type: 'TOPUP' | 'VIDEO_PURCHASE' | 'CREATOR_REVENUE';
  title: string;
  description?: string;
  amount: number;      // giá trị tuyệt đối (VND)
  direction: 'IN' | 'OUT';
  occurredAt?: string; // ISO datetime
  videoId?: string;
  videoSlug?: string; // Slug video cho link /watch/{slug}
}

export interface MonthlyStat {
  month: string;      // yyyy-MM
  deposits: number;
  spending: number;
  earnings: number;
}

export interface FinancialHistory {
  balance: number;
  revenue: number;
  totalDeposited: number;
  totalSpent: number;
  deposited30d: number;
  spent30d: number;
  revenue30d: number;
  events: FinancialEvent[];
  monthlyStats: MonthlyStat[];
}

export const getMyFinancialHistory = async (): Promise<FinancialHistory> => {
  return axiosClient.get(`${WALLET_ENDPOINT}/my-financial-history`);
};

export const checkTransactionWithAmount = async (description: string, amount: number, limit = 20) => {
  return axiosClient.post('sepay/check-transaction-with-amount', {
    description,
    amount,
    limit
  });
};

export const checkTransactionStatus = async (description: string, limit = 20) => {
  return axiosClient.post('sepay/check-status', {
    description,
    limit
  });
};
