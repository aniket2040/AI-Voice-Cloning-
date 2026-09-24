import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Waveform } from '../ui/Waveform';
import { fetchAuthenticatedAudioBlob } from '../../lib/api/client';

interface VoiceAudioPreviewProps {
  src?: string;
  voiceName: string;
  duration?: number;
  className?: string;
}

export const VoiceAudioPreview: React.FC<VoiceAudioPreviewProps> = ({
  src,
  voiceName,
  duration = 4.2,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playableSrc, setPlayableSrc] = useState<string | undefined>(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!src) {
      setPlayableSrc(undefined);
      return;
    }

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setPlayableSrc(src);
      return;
    }

    fetchAuthenticatedAudioBlob(src)
      .then((blobUrl) => {
        if (!active) return;
        objectUrl = blobUrl;
        setPlayableSrc(blobUrl);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Preview stream fallback:', err);
        setPlayableSrc(src);
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !(playableSrc || src)) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  const handleSeek = (percentage: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = percentage * audio.duration;
    setProgress(percentage);
  };

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={playableSrc || src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        disabled={!(playableSrc || src)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
          isPlaying
            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
            : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
        } disabled:opacity-40`}
        aria-label={isPlaying ? 'Pause' : 'Play preview'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <Waveform
          progress={progress}
          isPlaying={isPlaying}
          seed={voiceName}
          height={26}
          barCount={32}
          onSeek={handleSeek}
        />
      </div>

      <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
        {duration.toFixed(1)}s
      </span>
    </div>
  );
};
