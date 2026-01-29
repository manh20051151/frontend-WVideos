export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // Ít nhất 8 ký tự, có chữ hoa, chữ thường và số
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateUsername = (username: string): boolean => {
  // 3-20 ký tự, chỉ chữ cái, số và underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validateVideoTitle = (title: string): boolean => {
  return title.length >= 5 && title.length <= 100;
};

export const validateVideoDescription = (description: string): boolean => {
  return description.length >= 10 && description.length <= 5000;
};
