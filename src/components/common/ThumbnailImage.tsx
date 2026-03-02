'use client';

import React, { useState, useEffect } from 'react';

interface ThumbnailImageProps {
  src?: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  title: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function ThumbnailImage({ 
  src, 
  alt, 
  fallbackSrc, 
  className = '', 
  title,
  onError,
  onLoad 
}: ThumbnailImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state khi src thay đổi
  useEffect(() => {
    if (mounted) {
      setImageError(false);
      setImageLoaded(false);
      setCurrentSrc(src);
      setIsLoading(!!(src || fallbackSrc));
    }
  }, [src, fallbackSrc, mounted]);
  
  // Sử dụng src trực tiếp, fallback nếu src chính lỗi
  const displaySrc = currentSrc || fallbackSrc;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.currentTarget;
    console.log('❌ Thumbnail error details:', {
      currentSrc: currentSrc,
      fallbackSrc: fallbackSrc,
      imgSrc: imgElement.src,
      naturalWidth: imgElement.naturalWidth,
      naturalHeight: imgElement.naturalHeight,
      complete: imgElement.complete
    });
    
    // Nếu đang dùng src chính và có fallback, thử fallback
    if (currentSrc === src && fallbackSrc && fallbackSrc !== src) {
      console.log('🔄 Trying fallback URL:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      return;
    }
    
    // Nếu không có fallback hoặc fallback cũng lỗi
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.currentTarget;
    console.log('✅ Thumbnail loaded details:', {
      currentSrc: currentSrc,
      imgSrc: imgElement.src,
      naturalWidth: imgElement.naturalWidth,
      naturalHeight: imgElement.naturalHeight,
      complete: imgElement.complete
    });
    
    setImageLoaded(true);
    setIsLoading(false);
    onLoad?.();
  };

  // Nếu chưa mount, hiển thị placeholder
  if (!mounted) {
    return (
      <div className={`flex flex-col items-center justify-center text-foreground ${className}`}>
        <div className='w-16 h-16 mb-2 bg-accent opacity-30 rounded animate-pulse'></div>
        <span className='text-sm font-medium text-center px-2'>{title}</span>
        <span className='text-xs text-accent mt-1'>Đang tải...</span>
      </div>
    );
  }

  // Nếu không có src hoặc có lỗi, hiển thị fallback
  if (!displaySrc || imageError) {
    return (
      <div className={`flex flex-col items-center justify-center text-foreground ${className}`}>
        <svg className='w-16 h-16 mb-2 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
        </svg>
        <span className='text-sm font-medium text-center px-2'>{title}</span>
        <span className='text-xs text-accent mt-1'>
          {!displaySrc ? 'Chưa có thumbnail' : 'Lỗi tải thumbnail'}
        </span>
        {process.env.NODE_ENV === 'development' && (src || fallbackSrc) && (
          <div className='text-xs text-red-500 mt-1 break-all max-w-full p-2 bg-red-50 rounded'>
            <div>URLs tried:</div>
            {src && <div className='font-mono text-xs'>Primary: {src}</div>}
            {fallbackSrc && <div className='font-mono text-xs'>Fallback: {fallbackSrc}</div>}
            <div className='flex gap-1 mt-1'>
              {src && (
                <button 
                  onClick={() => window.open(src, '_blank')}
                  className='px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700'
                >
                  Test Primary
                </button>
              )}
              {fallbackSrc && (
                <button 
                  onClick={() => window.open(fallbackSrc, '_blank')}
                  className='px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700'
                >
                  Test Fallback
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={displaySrc}
        alt={alt}
        className='w-full h-full object-cover'
        onError={handleError}
        onLoad={handleLoad}
        loading='lazy'
        decoding='async'
      />
      
      {/* Loading indicator */}
      {isLoading && !imageLoaded && (
        <div className='absolute inset-0 flex flex-col items-center justify-center bg-secondary'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2'></div>
          <span className='text-xs text-foreground'>Đang tải...</span>
          {process.env.NODE_ENV === 'development' && (
            <div className='text-xs text-accent mt-1 break-all max-w-full text-center px-2'>
              {displaySrc?.substring(0, 40)}...
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}