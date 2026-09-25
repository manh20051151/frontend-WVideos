import type { Metadata } from 'next';

// Trang cá nhân không được index
export const metadata: Metadata = {
  title: 'Trang cá nhân',
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
