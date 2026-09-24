import React, { useState } from 'react';
import { Generation } from '../../lib/types';
import { AudioPlayer } from '../audio/AudioPlayer';
import { GenerationMetadata } from './GenerationMetadata';
import { Sparkles, Copy, Check, Quote } from 'lucide-react';

interface GenerationResultProps {
  generation: Generation;
  className?: string;
}

export const GenerationResult: React.FC<GenerationResultProps> = ({
  generation,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(generation.input_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const genTime =
    typeof generation.generation_time === 'number'
      ? generation.generation_time
      : Number(generation.generation_time || 0);

  return (
    <div
      id="generation-result-container"
      className={`p-6 rounded-2xl border border-cyan-500/40 bg-slate-900/90 backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.12)] space-y-5 animate-in fade-in duration-300 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">
              Neural Speech Synthesized
            </h4>
            <span className="text-xs font-mono text-cyan-400">
              Voice: {generation.voice_name || 'Cloned Voice'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyText}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
          title="Copy input text"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Text'}</span>
        </button>
      </div>

      {/* Audio Player with waveform, seek, volume, download */}
      <AudioPlayer
        src={generation.audio_url}
        title={generation.voice_name || 'Cloned Voice'}
        subtitle={`Inference completed in ${genTime.toFixed(2)}s`}
        seed={generation.id}
        downloadFilename={`speech_${generation.voice_name ? generation.voice_name.toLowerCase().replace(/\s+/g, '_') : 'cloned'}_${generation.id}.wav`}
      />

      {/* Input text quotation */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans relative">
        <Quote className="w-4 h-4 text-cyan-500/40 absolute top-2.5 right-2.5 pointer-events-none" />
        <span className="text-slate-400 text-xs font-mono block mb-1">Synthesized Transcript:</span>
        <p className="pr-6">{generation.input_text}</p>
      </div>

      {/* Generation technical metadata metrics */}
      <GenerationMetadata generation={generation} />
    </div>
  );
};
