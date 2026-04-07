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
