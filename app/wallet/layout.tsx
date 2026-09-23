import type { Metadata } from 'next';

// Ví/nạp tiền không được index
export const metadata: Metadata = {
  title: 'Ví tiền',
  robots: { index: false, follow: false },
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
