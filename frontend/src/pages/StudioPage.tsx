import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { AIStatusIndicator } from '../components/ui/AIStatusIndicator';
import { VoiceCard } from '../components/voice/VoiceCard';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useVoices } from '../hooks/useVoices';
import { useGeneration } from '../hooks/useGeneration';
import { Voice, Generation } from '../lib/types';
import {
  LayoutDashboard,
  Mic,
  CheckCircle2,
  Clock,
  Sparkles,
  PlusCircle,
  Wand2,
  ArrowRight,
  History,
} from 'lucide-react';

interface StudioPageProps {
  onNavigate: (path: string) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ onNavigate }) => {
  const { voices, readyVoices, isLoading: isLoadingVoices, removeVoice, refresh: refreshVoices } = useVoices();
  const { history: generations, isLoadingHistory, fetchHistory } = useGeneration();

  const [voiceToDelete, setVoiceToDelete] = useState<Voice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteConfirm = async () => {
    if (!voiceToDelete) return;
    setIsDeleting(true);
    await removeVoice(voiceToDelete.id);
    setIsDeleting(false);
    setVoiceToDelete(null);
  };

  const recentVoices = voices.slice(0, 3);
  const recentGenerations = generations.slice(0, 3);

  return (
    <div id="studio-dashboard-view" className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Studio Dashboard"
        subtitle="Manage neural voice models, inspect backend status, and execute real-time speech cloning."
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-3">
            <button
              id="dashboard-register-voice-btn"
              type="button"
              onClick={() => onNavigate('/voices/register')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Voice</span>
            </button>
            <button
              id="dashboard-generate-btn"
              type="button"
              onClick={() => onNavigate('/generate')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <span>Text-to-Speech</span>
            </button>
          </div>
        }
      />

      {/* Key Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Voices */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">Registered Voices</span>
            <div className="text-3xl font-bold text-white font-sans">
              {isLoadingVoices ? <Skeleton className="h-8 w-12" /> : voices.length}
            </div>
            <span className="text-[11px] font-mono text-cyan-400/90 mt-1 block">
              NeuTTS Library
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Mic className="w-6 h-6" />
          </div>
        </div>

        {/* READY Voices */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">READY For Synthesis</span>
            <div className="text-3xl font-bold text-emerald-300 font-sans">
              {isLoadingVoices ? <Skeleton className="h-8 w-12" /> : readyVoices.length}
            </div>
            <span className="text-[11px] font-mono text-emerald-400/80 mt-1 block">
              Reference Codes Encoded
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Generations */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">Cloned Generations</span>
            <div className="text-3xl font-bold text-blue-300 font-sans">
              {isLoadingHistory ? <Skeleton className="h-8 w-12" /> : generations.length}
            </div>
            <span className="text-[11px] font-mono text-blue-400/80 mt-1 block">
              Synthetic Speech Audios
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Backend Status Card */}
        <AIStatusIndicator />
      </div>

      {/* Quick Action Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/30 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Zero-Shot Cloner Ready
          </h3>
          <p className="text-xs text-slate-300">
            Select any READY voice profile and synthesize natural human speech with full temporal fidelity.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('/generate')}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch Generator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Voices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-sans tracking-wide">
              Recent Voice Profiles
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/voices')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({voices.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoadingVoices ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton count={3} className="h-44" />
          </div>
        ) : recentVoices.length === 0 ? (
          <EmptyState
            title="No voices registered yet"
            description="Upload reference audio to register your first neural voice clone."
            icon={Mic}
            actionLabel="Register Voice"
            onAction={() => onNavigate('/voices/register')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentVoices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                onSelectForGenerate={(id) => onNavigate(`/voices/${id}/generate`)}
                onViewDetails={(id) => onNavigate(`/voices/${id}`)}
                onDelete={(v) => setVoiceToDelete(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Speech Generations */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-sans tracking-wide">
              Recent Speech Generations
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/generations')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All History ({generations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoadingHistory ? (
          <Skeleton count={2} className="h-32" />
        ) : recentGenerations.length === 0 ? (
          <EmptyState
            title="No speech generated yet"
            description="Use a registered READY voice to synthesize text into natural audio speech."
            icon={Sparkles}
            actionLabel="Synthesize Speech"
            onAction={() => onNavigate('/generate')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentGenerations.map((gen) => (
              <div
                key={gen.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {gen.voice_name || 'Cloned Voice'}
                    </h4>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(gen.created_at).toLocaleTimeString()} • {gen.generation_time.toFixed(2)}s inference
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/20">
                    {gen.rtf ? `${gen.rtf.toFixed(2)}x RTF` : 'NeuTTS'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                  "{gen.input_text}"
                </p>

                <AudioPlayer
                  src={gen.audio_url}
                  title={gen.voice_name}
                  seed={gen.id}
                  allowDownload={true}
                  downloadFilename={`gen_${gen.id}.wav`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!voiceToDelete}
        title="Delete Voice Profile"
        message={`Are you sure you want to delete voice "${voiceToDelete?.name}"? All associated reference codes and temporary audio files will be permanently removed.`}
        confirmLabel="Delete Voice"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setVoiceToDelete(null)}
      />
    </div>
  );
};
