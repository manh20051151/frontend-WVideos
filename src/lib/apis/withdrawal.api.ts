import axiosClient from './axiosClient';

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WithdrawalResponse {
  id: string;
  userId: string;
  userEmail?: string;
  userFullName?: string;
  amount: number;
  bankName?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  status: WithdrawalStatus;
  adminNote?: string;
  createdAt?: string;
  processedAt?: string;
}

export interface WithdrawalPage {
  content: WithdrawalResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const MIN_WITHDRAWAL_AMOUNT = 500000;

export const withdrawalApi = {
  createMyWithdrawal: (amount: number): Promise<WithdrawalResponse> => {
    return axiosClient.post('/withdrawals', { amount });
  },

  getMyWithdrawals: (): Promise<WithdrawalResponse[]> => {
    return axiosClient.get('/withdrawals/my');
  },

  getWithdrawals: (page = 0, size = 10, status?: string): Promise<WithdrawalPage> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    return axiosClient.get(`/withdrawals/admin?${params.toString()}`);
  },

  updateStatus: (id: string, status: WithdrawalStatus, adminNote?: string): Promise<WithdrawalResponse> => {
    return axiosClient.put(`/withdrawals/admin/${id}/status`, { status, adminNote });
  },
};