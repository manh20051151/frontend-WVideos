import type { MetadataRoute } from 'next';

/**
 * robots.txt sinh tự động.
 * Chặn các trang riêng tư/quản trị khỏi Google, phần còn lại cho phép crawl.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snha.dpdns.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/profile',
          '/wallet',
          '/edit',
          '/oauth2',
          '/reset-password',
          '/confirm-registration',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
