import type { Metadata } from 'next';

// Trang cá nhân không được index
export const metadata: Metadata = {
  title: 'Kênh đã đăng ký',
  robots: { index: false, follow: false },
};

export default function SubscribedChannelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
