import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone output cho Docker image (chỉ bundle những gì cần chạy)
  output: "standalone",
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ticdn.net',
      },
      {
        protocol: 'https',
        hostname: 'thumb.tapecontent.net',
      },
      {
        protocol: 'https',
        hostname: 'tapecontent.net',
      },
    ],
  },
  // Suppress hydration warnings caused by browser extensions
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default withNextIntl(nextConfig);
