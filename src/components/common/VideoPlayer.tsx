'use client';

import { useEffect, useRef } from 'react';
import 'plyr/dist/plyr.css';

type PlyrInstance = {
  source: unknown;
  destroy: () => void;
};

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  onError?: () => void;
  className?: string;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  onError,
  className = 'w-full h-full',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlyrInstance | null>(null);

  useEffect(() => {
    if (!videoRef.current || typeof window === 'undefined') return;
    let cancelled = false;

    (async () => {
      const Plyr = (await import('plyr')).default;
      if (cancelled || !videoRef.current) return;

      const player = new Plyr(videoRef.current, {
        autoplay: autoPlay,
        controls: [
          'play-large',
          'rewind',
          'play',
          'fast-forward',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'settings',
          'pip',
          'airplay',
          'fullscreen',
        ],
        settings: ['captions', 'quality', 'speed', 'loop'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        tooltips: { controls: true, seek: true },
        ratio: '16:9',
      }) as PlyrInstance;

      playerRef.current = player;

      player.source = {
        type: 'video',
        title: title,
        poster: poster,
        sources: [{ src, type: 'video/mp4' }],
      };
    })();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [autoPlay, src, poster, title]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.source = {
      type: 'video',
      title: title,
      poster: poster,
      sources: [{ src, type: 'video/mp4' }],
    };
  }, [src, poster, title]);

  return (
    <div className='w-full h-full'>
      <video
        ref={videoRef}
        className='w-full h-full object-contain'
        playsInline
        poster={poster}
        title={title}
        onError={onError}
      />
    </div>
  );
}
