import React from 'react';
import { Voice } from '../../lib/types';
import { VoiceStatusBadge } from './VoiceStatusBadge';
import { VoiceAudioPreview } from './VoiceAudioPreview';
import { Mic, ArrowRight, Trash2, Eye, Cpu } from 'lucide-react';

interface VoiceCardProps {
  voice: Voice;
  onSelectForGenerate?: (voiceId: string) => void;
  onViewDetails?: (voiceId: string) => void;
  onDelete?: (voice: Voice) => void;
  className?: string;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  onSelectForGenerate,
  onViewDetails,
  onDelete,
  className = '',
}) => {
  const isReady = (voice.status || '').toUpperCase() === 'READY';

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id={`voice-card-${voice.id}`}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.12)] ${className}`}
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide group-hover:text-cyan-200 transition-colors">
                {voice.name}
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400/80" />
                  {voice.model || 'NeuTTS v1.2'}
                </span>
                <span>•</span>
                <span>{formatDate(voice.created_at)}</span>
              </div>
            </div>
          </div>
          <VoiceStatusBadge status={voice.status} size="sm" />
        </div>

        {/* Reference text snippet (or model summary) */}
        {voice.reference_text ? (
          <div className="my-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 font-sans line-clamp-2 italic leading-relaxed">
            "{voice.reference_text}"
          </div>
        ) : (
          <div className="my-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span className="truncate">Architecture: {voice.model}</span>
            <span className="text-slate-500 font-mono text-[10px] ml-2">ID: {voice.id.slice(0, 8)}...</span>
          </div>
        )}

        {/* Audio preview */}
        {voice.audio_url && (
          <div className="mt-2 mb-4">
            <VoiceAudioPreview
              src={voice.audio_url}
              voiceName={voice.name}
              duration={voice.sample_duration || 4.2}
            />
          </div>
        )}
      </div>

      {/* Footer action buttons */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1">
          {onViewDetails && (
            <button
              id={`view-voice-btn-${voice.id}`}
              type="button"
              onClick={() => onViewDetails(voice.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="View voice details"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              id={`delete-voice-btn-${voice.id}`}
              type="button"
              onClick={() => onDelete(voice)}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Delete voice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {onSelectForGenerate && (
          <button
            id={`use-voice-btn-${voice.id}`}
            type="button"
            disabled={!isReady}
            onClick={() => onSelectForGenerate(voice.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              isReady
                ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer'
                : 'bg-slate-800/50 text-slate-500 border border-slate-700/40 cursor-not-allowed'
            }`}
          >
            <span>{isReady ? 'Use for TTS' : 'Not Ready'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
