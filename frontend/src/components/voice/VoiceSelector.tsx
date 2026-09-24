import React from 'react';
import { Voice } from '../../lib/types';
import { VoiceStatusBadge } from './VoiceStatusBadge';
import { Mic, Check, ChevronDown } from 'lucide-react';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  onSelectVoice: (voiceId: string) => void;
  className?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  className = '',
}) => {
  const readyVoices = voices.filter((v) => v.status === 'READY');
  const selectedVoice = readyVoices.find((v) => v.id === selectedVoiceId) || readyVoices[0];

  return (
    <div id="voice-selector-container" className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-cyan-400" />
          Active Neural Voice
        </label>
        <span className="text-xs font-mono text-slate-400">
          {readyVoices.length} READY voice{readyVoices.length === 1 ? '' : 's'} available
        </span>
      </div>

      {readyVoices.length === 0 ? (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono">
          No READY voices available. Please register or wait for processing to complete.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {readyVoices.map((voice) => {
            const isSelected = voice.id === (selectedVoice?.id || selectedVoiceId);

            return (
              <button
                key={voice.id}
                id={`voice-select-item-${voice.id}`}
                type="button"
                onClick={() => onSelectVoice(voice.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-400/80 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/50'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-white truncate block">
                    {voice.name}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                {voice.reference_text ? (
                  <div className="text-[11px] font-mono text-slate-400 line-clamp-1 italic">
                    "{voice.reference_text}"
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-slate-500">
                    Voice Profile • {voice.status}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-1.5">
                  <span>{voice.model || 'NeuTTS v1.2'}</span>
                  <span className="text-cyan-400/90">{voice.sample_duration ? `${voice.sample_duration.toFixed(1)}s sample` : 'Encoded'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
