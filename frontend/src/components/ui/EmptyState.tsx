import React from 'react';
import { LucideIcon, Mic } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Mic,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      id="empty-state-view"
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm ${className}`}
    >
      <div className="w-16 h-16 mb-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          id="empty-state-action-btn"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
