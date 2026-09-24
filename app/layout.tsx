import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import DynamicFavicon from '@/components/layout/SiteBranding';

// Font chuẩn YouTube - Roboto, hỗ trợ tiếng Việt
const roboto = Roboto({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap',
});

// SEO: URL gốc dùng cho canonical/Open Graph/sitemap, đổi qua env NEXT_PUBLIC_SITE_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';

// JSON-LD WebSite + SearchAction: Google gắn hộp tìm kiếm vào kết quả tìm kiếm snha
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'snha',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'snha - Nền tảng chia sẻ video',
    template: '%s | snha',
  },
  description: 'Nền tảng chia sẻ video hàng đầu Việt Nam. Xem shorts, tin tức, clip sao và nhiều nội dung sáng tạo mỗi ngày.',
  alternates: {
    canonical: './',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'snha',
    url: SITE_URL,
    title: 'snha - Nền tảng chia sẻ video',
    description: 'Nền tảng chia sẻ video hàng đầu Việt Nam. Xem shorts, tin tức, clip sao và nhiều nội dung sáng tạo mỗi ngày.',
  },
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
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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

                // Strip các attribute do extension trình duyệt chèn vào DOM
                // (vd: bis_skin_checked, data-new-gr-c-s-check-loaded, ...)
                // gây lỗi hydration mismatch. Chạy đồng bộ trước khi React hydrate.
                try {
                  var ATTRS = [
                    "bis_skin_checked",
                    "data-google-query-id",
                    "data-new-gr-c-s-check-loaded",
                    "data-gr-ext-installed",
                    "data-lt-installed",
                    "data-lt-tmp-id"
                  ];
                  function strip(root) {
                    if (!root) return;
                    for (var i = 0; i < ATTRS.length; i++) {
                      if (root.removeAttribute) root.removeAttribute(ATTRS[i]);
                    }
                    if (root.querySelectorAll) {
                      var nodes = root.querySelectorAll("*");
                      for (var j = 0; j < nodes.length; j++) {
                        for (var k = 0; k < ATTRS.length; k++) {
                          nodes[j].removeAttribute(ATTRS[k]);
                        }
                      }
                    }
                  }
                  strip(document.documentElement);
                  if (typeof MutationObserver !== "undefined") {
                    var obs = new MutationObserver(function(mutations) {
                      for (var m = 0; m < mutations.length; m++) {
                        var target = mutations[m].target;
                        for (var a = 0; a < ATTRS.length; a++) {
                          if (target.removeAttribute) target.removeAttribute(ATTRS[a]);
                        }
                      }
                    });
                    obs.observe(document.documentElement, {
                      attributes: true,
                      attributeFilter: ATTRS,
                      subtree: true,
                      childList: true
                    });
                    setTimeout(function() { obs.disconnect(); }, 5000);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${roboto.className} antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <DynamicFavicon />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
