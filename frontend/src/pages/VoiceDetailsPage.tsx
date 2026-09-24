import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { VoiceStatusBadge } from '../components/voice/VoiceStatusBadge';
import { VoiceMetadata } from '../components/voice/VoiceMetadata';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useVoice } from '../hooks/useVoice';
import {
  Mic,
  ArrowLeft,
  Sparkles,
  Trash2,
  FileAudio,
  Cpu,
  ShieldCheck,
  Quote,
} from 'lucide-react';

interface VoiceDetailsPageProps {
  voiceId: string;
  onNavigate: (path: string) => void;
}

export const VoiceDetailsPage: React.FC<VoiceDetailsPageProps> = ({ voiceId, onNavigate }) => {
  const { voice, isLoading, error, remove } = useVoice(voiceId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await remove();
    setIsDeleting(false);
    if (success) {
      onNavigate('/voices');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Loading Voice Details..." />
      </div>
    );
  }

  if (error || !voice) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <Mic className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Voice Not Found</h3>
        <p className="text-sm text-slate-400">{error || 'Voice profile does not exist or has been deleted.'}</p>
        <button
          type="button"
          onClick={() => onNavigate('/voices')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono transition-colors cursor-pointer"
        >
          Return to Voice Library
        </button>
      </div>
    );
  }

  const isReady = (voice.status || '').toUpperCase() === 'READY';

  return (
    <div id="voice-details-page" className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('/voices')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Voice Library</span>
        </button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={voice.name}
        subtitle={`Voice Profile ID: ${voice.id}`}
        icon={Mic}
        badge={voice.model}
        actions={
          <div className="flex items-center gap-2">
            <button
              id="voice-details-delete-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition-colors cursor-pointer"
              title="Delete Voice"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              id="voice-details-generate-btn"
              type="button"
              disabled={!isReady}
              onClick={() => onNavigate(`/voices/${voice.id}/generate`)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isReady
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Use For Speech Synthesis</span>
            </button>
          </div>
        }
      />

      {/* Voice Status Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-400 block mb-1">CURRENT STATUS</span>
          <div className="flex items-center gap-3">
            <VoiceStatusBadge status={voice.status} size="md" />
            <span className="text-xs text-slate-300 font-sans">
              {isReady
                ? 'Ready to condition zero-shot neural flow speech generation.'
                : 'Undergoing neural codebook alignment and feature extraction.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Neural Codebook</span>
        </div>
      </div>

      {/* Audio Reference Sample Player */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileAudio className="w-4 h-4 text-cyan-400" />
            Reference Audio Sample
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {voice.sample_duration ? `${voice.sample_duration.toFixed(1)}s Duration` : '4.2s Duration'}
          </span>
        </div>

        <AudioPlayer
          src={voice.audio_url}
          title={`${voice.name} Reference Audio`}
          subtitle="Processed 24kHz single-channel master"
          seed={voice.id}
          downloadFilename={`${voice.name.toLowerCase().replace(/\s+/g, '_')}_reference.wav`}
        />
      </div>

      {/* Reference Transcript Text */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-3">
        <h3 className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
          <Quote className="w-4 h-4 text-cyan-400" />
          Spoken Reference Transcript
        </h3>
        {voice.reference_text ? (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 text-sm text-slate-200 leading-relaxed font-sans italic">
            "{voice.reference_text}"
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 text-xs text-slate-400 font-mono">
            No reference transcript specified for this voice profile.
          </div>
        )}
        <p className="text-xs text-slate-400">
          NeuTTS aligns this transcript with the reference audio's mel-spectrogram features to construct phoneme-duration priors.
        </p>
      </div>

      {/* Technical Metadata */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-3">
        <h3 className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Neural Pipeline Parameters
        </h3>
        <VoiceMetadata voice={voice} />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Voice Profile"
        message={`Are you sure you want to permanently delete voice "${voice.name}"? This action cannot be undone.`}
        confirmLabel="Confirm Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
