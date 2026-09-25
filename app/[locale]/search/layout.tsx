import type { Metadata } from 'next';

// Kết quả tìm kiếm không được index (tránh hàng loạt URL rác trên Google)
export const metadata: Metadata = {
  title: 'Tìm kiếm',
  robots: { index: false, follow: false },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
