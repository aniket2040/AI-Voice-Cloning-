import React from 'react';
import { VoiceStatus } from '../../lib/types';
import { CheckCircle2, Clock, AlertCircle, UploadCloud } from 'lucide-react';

interface VoiceStatusBadgeProps {
  status: VoiceStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const VoiceStatusBadge: React.FC<VoiceStatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    case 'READY':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          READY
        </span>
      );

    case 'PROCESSING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] ${sizeClasses} ${className}`}
        >
          <Clock className="w-3 h-3 animate-spin text-cyan-400" />
          PROCESSING
        </span>
      );

    case 'UPLOADING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 ${sizeClasses} ${className}`}
        >
          <UploadCloud className="w-3 h-3 animate-bounce text-blue-400" />
          UPLOADING
        </span>
      );

    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 ${sizeClasses} ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-rose-400" />
          FAILED
        </span>
      );

    case 'IDLE':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          {normalized || 'IDLE'}
        </span>
      );
  }
};
