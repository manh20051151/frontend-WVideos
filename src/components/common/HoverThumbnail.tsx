'use client';

import React, { useState, useEffect } from 'react';

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
      img.onload = () => {
        setSplashLoaded(true);
        console.log('✅ Splash preloaded for:', title);
      };
      img.onerror = () => {
        setSplashError(true);
        console.log('❌ Splash preload failed for:', title);
      };
      img.src = splashImageUrl;
    }
  }, [splashImageUrl, title]);

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
      className={`relative overflow-hidden cursor-pointer ${className}`}
      onMouseEnter={() => {
        console.log('🖱️ Mouse enter:', title);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        console.log('🖱️ Mouse leave:', title);
        setIsHovered(false);
      }}
    >
      {/* Thumbnail Image - luôn hiển thị làm background */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={alt}
          className='w-full h-full object-cover'
          onError={onError}
          onLoad={onLoad}
          loading='lazy'
          decoding='async'
        />
      )}
      
      {/* Splash Image Overlay - hiển thị khi hover và đã load */}
      {isHovered && splashImageUrl && splashLoaded && !splashError && (
        <img
          src={splashImageUrl}
          alt={`${alt} - Splash`}
          className='absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100'
          loading='eager'
          decoding='async'
        />
      )}
      
      {/* Loading indicator khi hover nhưng splash chưa load */}
      {isHovered && splashImageUrl && !splashLoaded && !splashError && (
        <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
        </div>
      )}
      
      {/* Hover indicator */}
      {isHovered && splashImageUrl && splashLoaded && !splashError && (
        <div className='absolute top-2 left-2 bg-accent text-foreground px-2 py-1 rounded text-xs font-medium z-10'>
          🖼️ Splash
        </div>
      )}
      
      {/* Error indicator khi splash lỗi */}
      {isHovered && splashImageUrl && splashError && (
        <div className='absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium z-10'>
          ❌ Splash lỗi
        </div>
      )}
      
      {/* No splash indicator */}
      {isHovered && !splashImageUrl && (
        <div className='absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium z-10'>
          ⚠️ Không có splash
        </div>
      )}
    </div>
  );
}