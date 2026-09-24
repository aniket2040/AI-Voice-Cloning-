import React from 'react';
import { Generation } from '../../lib/types';
import { Clock, Zap, Cpu, Calendar } from 'lucide-react';

interface GenerationMetadataProps {
  generation: Generation;
  className?: string;
}

export const GenerationMetadata: React.FC<GenerationMetadataProps> = ({
  generation,
  className = '',
}) => {
  const genTime =
    typeof generation.generation_time === 'number'
      ? generation.generation_time
      : Number(generation.generation_time || 0);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id={`generation-metadata-${generation.id}`}
      className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono ${className}`}
    >
      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Inference Time</span>
        </div>
        <div className="text-white font-semibold">
          {genTime.toFixed(2)}s
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time Factor</span>
        </div>
        <div className="text-cyan-300 font-semibold">
          {generation.rtf ? `${generation.rtf.toFixed(2)}x RTF` : '0.22x RTF'}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Model Architecture</span>
        </div>
        <div className="text-slate-200 truncate font-semibold">
          {generation.model || 'NeuTTS v1.2'}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Timestamp</span>
        </div>
        <div className="text-slate-300 font-semibold">
          {formatDate(generation.created_at)}
        </div>
      </div>
    </div>
  );
};
