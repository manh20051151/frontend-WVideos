'use client';

import React, { useState, useRef, useEffect } from 'react';

interface VideoPreviewProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title: string;
  className?: string;
  children?: React.ReactNode;
  hoverDelay?: number; // Delay trước khi bắt đầu preview (ms)
}

export default function VideoPreview({ 
  videoUrl, 
  thumbnailUrl, 
  title, 
  className = '',
  children,
  hoverDelay = 1000 // 1 giây delay
}: VideoPreviewProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Xử lý hover
  const handleMouseEnter = () => {
    setIsHovering(true);
    
    // Chỉ hiển thị preview nếu có videoUrl
    if (videoUrl) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (isHovering) {
          setShowPreview(true);
        }
      }, hoverDelay);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setShowPreview(false);
    setVideoLoaded(false);
    
    // Clear timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Pause video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Auto play khi video loaded
  useEffect(() => {
    if (showPreview && videoLoaded && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Video autoplay failed:', error);
        });
      }
    }
  }, [showPreview, videoLoaded]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Nội dung chính (thumbnail) */}
      {children}
      
      {/* Video preview overlay */}
      {showPreview && videoUrl && (
        <div className='absolute inset-0 z-10 bg-black rounded-lg overflow-hidden'>
          <video
            ref={videoRef}
            className='w-full h-full object-cover'
            muted
            loop
            playsInline
            preload='metadata'
            onLoadedData={() => setVideoLoaded(true)}
            onError={(e) => {
              console.log('Video preview error:', e);
              setShowPreview(false);
            }}
          >
            <source src={videoUrl} type='video/mp4' />
            {/* Fallback cho các format khác */}
            <source src={videoUrl} type='video/webm' />
            <source src={videoUrl} type='video/ogg' />
          </video>
          
          {/* Loading indicator */}
          {!videoLoaded && (
            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
            </div>
          )}
          
          {/* Preview indicator */}
          <div className='absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded'>
            🎬 Preview
          </div>
          
          {/* Mute indicator */}
          <div className='absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1'>
            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z' clipRule='evenodd' />
            </svg>
            <span className='line-through'>🔊</span>
          </div>
          
          {/* Hover hint */}
          <div className='absolute top-2 right-2 bg-accent bg-opacity-90 text-foreground text-xs px-2 py-1 rounded'>
            Hover để xem preview
          </div>
        </div>
      )}
    </div>
  );
}