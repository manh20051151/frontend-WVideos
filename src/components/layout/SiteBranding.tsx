'use client';

/**
 * Site branding (logo, favicon) từ cấu hình admin.
 * Cache module-level để Header, favicon, ... dùng chung 1 request.
 */

import { useEffect, useState } from 'react';
import { siteSettingApi } from '@/lib/apis';

export interface SiteBranding {
  logoUrl?: string;
  faviconUrl?: string;
}

let cache: SiteBranding | null = null;
let fetching: Promise<SiteBranding> | null = null;

async function fetchBranding(): Promise<SiteBranding> {
  if (cache) return cache;
  if (!fetching) {
    fetching = siteSettingApi
      .getPublicSettings()
      .then((map) => {
        cache = {
          logoUrl: map?.SITE_LOGO || undefined,
          faviconUrl: map?.SITE_FAVICON || undefined,
        };
        return cache;
      })
      .catch(() => {
        cache = {};
        return cache;
      });
  }
  return fetching;
}

export function useSiteBranding(): SiteBranding {
  const [branding, setBranding] = useState<SiteBranding>(cache ?? {});
  useEffect(() => {
    fetchBranding().then(setBranding);
  }, []);
  return branding;
}

/**
 * Cập nhật <link rel="icon"> theo favicon admin cấu hình.
 */
export default function DynamicFavicon() {
  const { faviconUrl } = useSiteBranding();

  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [faviconUrl]);

  return null;
}
