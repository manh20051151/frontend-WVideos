import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WVideos - Nền tảng chia sẻ video',
  description: 'Nền tảng chia sẻ video hàng đầu Việt Nam',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='vi'>
      <body className='antialiased min-h-screen flex flex-col'>
        {children}
      </body>
    </html>
  );
}
