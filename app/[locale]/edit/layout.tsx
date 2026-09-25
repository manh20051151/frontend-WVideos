import type { Metadata } from 'next';

// Trang sửa video không được index
export const metadata: Metadata = {
  title: 'Chỉnh sửa video',
  robots: { index: false, follow: false },
};

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
