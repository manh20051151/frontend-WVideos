'use client';

/**
 * Logo site render theo kỹ thuật giống avatar (UserDropdown):
 * - Có cấu hình SITE_LOGO và ảnh load được: <img> thường, object-contain.
 * - Ảnh lỗi (onError) hoặc chưa cấu hình: fallback là brand chữ (truyền từ ngoài vào).
 * Kích thước ảnh và nội dung fallback do nơi dùng quyết định.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useSiteBranding } from './SiteBranding';

interface SiteLogoProps {
  imgClassName?: string;
  fallback: ReactNode;
}

export default function SiteLogo({ imgClassName = 'h-9 w-auto max-w-[140px] object-contain', fallback }: SiteLogoProps) {
  const { logoUrl } = useSiteBranding();
  const [logoError, setLogoError] = useState(false);

  // Đổi logo mới trong admin thì reset lỗi để thử load lại
  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  if (logoUrl && !logoError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt='snha'
        className={imgClassName}
        onError={() => setLogoError(true)}
      />
    );
  }

  return <>{fallback}</>;
}
