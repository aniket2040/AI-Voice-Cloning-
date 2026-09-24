import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  count = 1,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'h-4 w-full rounded';
      case 'rectangular':
      default:
        return 'rounded-xl';
    }
  };

  const elements = Array.from({ length: count });

  return (
    <>
      {elements.map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-800/60 border border-slate-700/30 ${getVariantClass()} ${className}`}
        />
      ))}
    </>
  );
};
