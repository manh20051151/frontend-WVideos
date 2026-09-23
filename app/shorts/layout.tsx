import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shorts',
  description: 'Xem các video shorts ngắn hấp dẫn nhất trên WVideos.',
};

export default function ShortsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
