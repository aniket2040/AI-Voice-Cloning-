import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} id="loading-spinner-container">
      <div className="relative">
        <div
          className={`${sizeMap[size]} rounded-full border-cyan-500/20 border-t-cyan-400 animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeMap[size]} rounded-full border-blue-500/10 border-b-blue-400 animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
        />
      </div>
      {label && (
        <span className="text-xs font-mono tracking-wider text-cyan-300/80 uppercase animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};
