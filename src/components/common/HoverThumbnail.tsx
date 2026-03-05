'use client';

import { useState, useEffect, useRef } from 'react';

interface HoverThumbnailProps {
  thumbnailUrl?: string;
  splashImageUrl?: string;
  alt: string;
  title: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function HoverThumbnail({
  thumbnailUrl,
  splashImageUrl,
  alt,
  title,
  className = '',
  onError,
  onLoad
}: HoverThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [splashLoaded, setSplashLoaded] = useState(false);
  const [splashError, setSplashError] = useState(false);

  // Preload splash image khi component mount
  useEffect(() => {
    if (splashImageUrl) {
      const img = new Image();
      img.onload = () => setSplashLoaded(true);
      img.onerror = () => setSplashError(true);
      img.src = splashImageUrl;
    }
  }, [splashImageUrl]);

  // Nếu không có URL nào
  if (!thumbnailUrl && !splashImageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center text-foreground bg-secondary ${className}`}>
        <svg className='w-16 h-16 mb-2 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
        </svg>
        <span className='text-sm font-medium text-center px-2'>{title}</span>
        <span className='text-xs text-accent mt-1'>Chưa có thumbnail</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden z-10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Image */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={alt}
          className='w-full h-full object-cover'
          onError={onError}
          onLoad={onLoad}
          loading='lazy'
        />
      )}
      
      {/* Splash Image - hiện khi hover */}
      {splashImageUrl && splashLoaded && !splashError && (
        <img
          src={splashImageUrl}
          alt={`${alt} - Splash`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}