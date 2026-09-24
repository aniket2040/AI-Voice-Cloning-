import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      id="page-header"
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.15)] mt-0.5">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              {title}
            </h1>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
