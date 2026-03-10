import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

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
    <html lang='vi' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var darkMode = localStorage.getItem("darkMode");
                  if (darkMode === "false") {
                    document.documentElement.classList.remove("dark");
                  } else {
                    // Mặc định dark mode
                    document.documentElement.classList.add("dark");
                    if (darkMode === null) {
                      localStorage.setItem("darkMode", "true");
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className='antialiased min-h-screen flex flex-col' suppressHydrationWarning>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
