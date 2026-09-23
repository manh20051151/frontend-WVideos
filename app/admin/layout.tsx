import type { Metadata } from 'next';

// Trang quản trị không được index
export const metadata: Metadata = {
  title: 'Quản trị',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
