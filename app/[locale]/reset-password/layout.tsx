import type { Metadata } from 'next';

// Trang đặt lại mật khẩu không được index
export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
