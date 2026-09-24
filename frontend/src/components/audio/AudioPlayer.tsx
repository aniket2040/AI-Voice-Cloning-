import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Waveform } from '../ui/Waveform';
import { fetchAuthenticatedAudioBlob } from '../../lib/api/client';

interface AudioPlayerProps {
  src?: string;
  title?: string;
  subtitle?: string;
  seed?: string;
  allowDownload?: boolean;
  downloadFilename?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  subtitle,
  seed = 'player_audio',
  allowDownload = true,
  downloadFilename = 'synthesized_voice.wav',
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playableSrc, setPlayableSrc] = useState<string | undefined>(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticate & resolve stream URL to local Blob for playback
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
        console.warn('Playback stream fallback:', err);
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

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      // If no valid src or unable to decode
      if (playableSrc) {
        setError('Audio source could not be played directly.');
      }
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playableSrc]);

  // Handle playableSrc change
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
  }, [playableSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
        setError('Unable to start audio playback');
      });
    }
  };

  const handleSeek = (percentage: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const targetTime = percentage * (duration || 5);
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      id="neural-audio-player"
      className={`relative p-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${className}`}
    >
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={playableSrc || src} preload="metadata" />

      {/* Header Info */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && (
              <h4 className="text-sm font-semibold text-white tracking-wide">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <span className="text-[11px] font-mono text-cyan-400/90 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
            {formatTime(currentTime)} / {formatTime(duration || 4.5)}
          </span>
        </div>
      )}

      {/* Waveform Scrubber */}
      <div className="mb-3 px-1">
        <Waveform
          progress={progress}
          isPlaying={isPlaying}
          seed={seed}
          height={38}
          interactive={!!src}
          onSeek={handleSeek}
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            id="audio-play-pause-btn"
            type="button"
            onClick={togglePlay}
            disabled={!src}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isPlaying
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Restart */}
          <button
            id="audio-restart-btn"
            type="button"
            onClick={handleRestart}
            disabled={!src}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-40"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Controls & Download */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <button
              id="audio-mute-btn"
              type="button"
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              id="audio-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              aria-label="Volume slider"
            />
          </div>

          {allowDownload && (playableSrc || src) && (
            <a
              id="audio-download-link"
              href={playableSrc || src}
              download={downloadFilename}
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors flex items-center gap-1.5 text-xs font-mono"
              title="Download synthesized WAV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">WAV</span>
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 text-[11px] text-amber-400/90 font-mono">
          Note: {error}
        </div>
      )}
    </div>
  );
};
