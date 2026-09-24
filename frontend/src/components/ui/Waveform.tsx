import React, { useRef } from 'react';

interface WaveformProps {
  progress?: number; // 0 to 1
  isPlaying?: boolean;
  barCount?: number;
  height?: number;
  interactive?: boolean;
  onSeek?: (percentage: number) => void;
  className?: string;
  seed?: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  progress = 0,
  isPlaying = false,
  barCount = 48,
  height = 42,
  interactive = true,
  onSeek,
  className = '',
  seed = 'default_seed',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate deterministic bar heights based on seed
  const bars = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const result: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const pseudoRand = Math.abs(Math.sin((hash + i * 19.3) * 0.45));
      const val = 0.2 + pseudoRand * 0.75;
      result.push(val);
    }
    return result;
  }, [seed, barCount]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage);
  };

  return (
    <div
      ref={containerRef}
      id="waveform-visualizer"
      onPointerDown={handlePointerDown}
      style={{ height: `${height}px` }}
      className={`relative w-full flex items-center gap-[3px] py-1 select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {bars.map((normalizedHeight, index) => {
        const barPercent = index / (barCount - 1);
        const isPast = barPercent <= progress;

        // Subtle dynamic pulse when playing
        const dynamicScale = isPlaying && isPast ? 1 + 0.15 * Math.sin(Date.now() / 200 + index * 0.5) : 1;
        const currentHeight = Math.max(4, Math.round(normalizedHeight * height * 0.9 * dynamicScale));

        return (
          <div
            key={index}
            style={{ height: `${currentHeight}px` }}
            className={`flex-1 min-w-[2px] max-w-[5px] rounded-full transition-all duration-75 ${
              isPast
                ? 'bg-gradient-to-t from-cyan-500 to-blue-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'bg-slate-700/50 group-hover:bg-slate-600/60'
            }`}
          />
        );
      })}

      {/* Interactive hover scrubber line */}
      {interactive && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-cyan-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress * 100}%` }}
        />
      )}
    </div>
  );
};
