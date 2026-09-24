import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  className = '',
}) => {
  const percentage = (current / max) * 100;
  const isOver = current > max;
  const isWarning = percentage > 85 && !isOver;

  return (
    <div
      className={`flex items-center gap-2 font-mono text-xs ${
        isOver
          ? 'text-rose-400 font-semibold'
          : isWarning
          ? 'text-amber-400'
          : 'text-slate-400'
      } ${className}`}
    >
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-150 ${
            isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-cyan-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <span>
        {current.toLocaleString()} / {max.toLocaleString()} chars
      </span>
    </div>
  );
};
