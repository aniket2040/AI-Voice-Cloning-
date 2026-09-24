import React, { useState } from 'react';
import { Voice } from '../../lib/types';
import { CharacterCounter } from '../forms/CharacterCounter';
import { MAX_TEXT_CHARACTERS } from '../../lib/constants';
import { Sparkles, AlertCircle, Wand2, RefreshCw } from 'lucide-react';
import { AudioVisualizer } from '../ui/AudioVisualizer';

interface GenerationFormProps {
  selectedVoice: Voice | null;
  isGenerating: boolean;
  error?: string | null;
  onGenerate: (text: string) => void;
  className?: string;
}

const SAMPLE_PROMPTS = [
  "Welcome aboard the orbital shuttle. Atmospheric pressure and environmental parameters are currently stabilizing.",
  "Deep neural synthesis reconstructs the subtle resonance of human speech with zero loss of harmonic timbre.",
  "In this chapter of acoustic intelligence, artificial voices possess nuanced prosody and emotional cadence.",
];

export const GenerationForm: React.FC<GenerationFormProps> = ({
  selectedVoice,
  isGenerating,
  error,
  onGenerate,
  className = '',
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isGenerating) return;
    onGenerate(text);
  };

  const handleInsertSample = (sample: string) => {
    setText(sample);
  };

  const isOverLimit = text.length > MAX_TEXT_CHARACTERS;
  const isReady = selectedVoice?.status === 'READY';
  const canSubmit = text.trim().length > 0 && !isOverLimit && isReady && !isGenerating;

  return (
    <form
      id="speech-generation-form"
      onSubmit={handleSubmit}
      className={`p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="speech-input-textarea"
          className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
          Text to Synthesize
        </label>
        <CharacterCounter current={text.length} max={MAX_TEXT_CHARACTERS} />
      </div>

      <div className="relative">
        <textarea
          id="speech-input-textarea"
          rows={5}
          value={text}
          disabled={isGenerating}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter or paste the text you want this cloned voice to speak (up to 5,000 characters)..."
          className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm font-sans focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-y disabled:opacity-60"
        />

        {isGenerating && (
          <div className="absolute inset-0 rounded-xl bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <AudioVisualizer active={true} barCount={24} size="md" />
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs tracking-wider animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>GENERATING CLONED SPEECH...</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              NeuTTS flow matching inference in progress
            </span>
          </div>
        )}
      </div>

      {/* Quick sample prompts */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-mono text-slate-400">Quick Prompts:</span>
        {SAMPLE_PROMPTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isGenerating}
            onClick={() => handleInsertSample(sample)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors border border-slate-700/50 cursor-pointer disabled:opacity-40"
          >
            Sample {idx + 1}
          </button>
        ))}
        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            className="ml-auto text-[11px] font-mono text-slate-400 hover:text-rose-400 cursor-pointer"
          >
            Clear Text
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs font-mono text-slate-400">
          {selectedVoice ? (
            <span>
              Target Voice: <strong className="text-cyan-300">{selectedVoice.name}</strong> ({selectedVoice.model})
            </span>
          ) : (
            <span className="text-amber-400">Select a voice above to enable generation</span>
          )}
        </div>

        <button
          id="generate-speech-submit-btn"
          type="submit"
          disabled={!canSubmit}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
            canSubmit
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)]'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Generating Speech...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Cloned Speech</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
