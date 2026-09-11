import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';

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
      <body className='antialiased min-h-screen flex flex-col' suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
