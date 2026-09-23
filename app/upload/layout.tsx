import type { Metadata } from 'next';

// Trang upload không được index
export const metadata: Metadata = {
  title: 'Tải lên video',
  robots: { index: false, follow: false },
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
