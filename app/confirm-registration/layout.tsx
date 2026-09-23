import type { Metadata } from 'next';

// Trang xác nhận đăng ký không được index
export const metadata: Metadata = {
  title: 'Xác nhận đăng ký',
  robots: { index: false, follow: false },
};

export default function ConfirmRegistrationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
