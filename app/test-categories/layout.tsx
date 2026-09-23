import type { Metadata } from 'next';

// Trang test không được index
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TestCategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
