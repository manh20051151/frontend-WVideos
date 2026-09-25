import type { Metadata } from 'next';

// Callback OAuth2 không cần index
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Oauth2Layout({ children }: { children: React.ReactNode }) {
  return children;
}
