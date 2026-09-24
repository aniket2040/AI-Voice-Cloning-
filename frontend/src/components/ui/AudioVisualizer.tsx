import React from 'react';

interface AudioVisualizerProps {
  active?: boolean;
  barCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  active = true,
  barCount = 18,
  className = '',
  size = 'md',
}) => {
  const heightClasses = {
    sm: 'h-4',
    md: 'h-7',
    lg: 'h-12',
  };

  return (
    <div
      id="live-audio-visualizer"
      className={`flex items-center gap-[3px] justify-center ${heightClasses[size]} ${className}`}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Vary animation durations and delays for cybernetic speech pattern
        const duration = 0.5 + ((i * 3) % 7) * 0.1;
        const delay = ((i * 5) % 9) * 0.08;

        return (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-all ${
              active
                ? 'bg-gradient-to-t from-cyan-500 via-blue-400 to-indigo-300 animate-pulse'
                : 'bg-slate-700 h-1.5'
            }`}
            style={{
              height: active ? `${30 + ((i * 17) % 65)}%` : '15%',
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};
