import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { VoiceSelector } from '../components/voice/VoiceSelector';
import { GenerationForm } from '../components/generation/GenerationForm';
import { GenerationResult } from '../components/generation/GenerationResult';
import { EmptyState } from '../components/ui/EmptyState';
import { useVoices } from '../hooks/useVoices';
import { useGeneration } from '../hooks/useGeneration';
import { Wand2, Mic, Sparkles, PlusCircle } from 'lucide-react';

interface GeneratePageProps {
  preselectedVoiceId?: string;
  onNavigate: (path: string) => void;
}

export const GeneratePage: React.FC<GeneratePageProps> = ({
  preselectedVoiceId,
  onNavigate,
}) => {
  const { voices, readyVoices, isLoading: isLoadingVoices } = useVoices();
  const { isGenerating, currentGeneration, error, generate, clearError } = useGeneration();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(
    preselectedVoiceId || null
  );

  useEffect(() => {
    if (preselectedVoiceId) {
      setSelectedVoiceId(preselectedVoiceId);
    } else if (!selectedVoiceId && readyVoices.length > 0) {
      setSelectedVoiceId(readyVoices[0].id);
    }
  }, [preselectedVoiceId, readyVoices, selectedVoiceId]);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || readyVoices[0] || null;

  const handleGenerate = async (text: string) => {
    if (!selectedVoice) return;
    clearError();
    await generate(selectedVoice.id, text, selectedVoice);
  };

  return (
    <div id="text-to-speech-page" className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Text-to-Speech Synthesis"
        subtitle="Select an active READY voice profile and enter up to 5,000 characters of text to synthesize natural cloned speech."
        icon={Wand2}
        badge="NeuTTS Flow Matcher"
      />

      {readyVoices.length === 0 && !isLoadingVoices ? (
        <EmptyState
          title="No READY Voices Available"
          description="You need at least one completed READY voice profile before you can synthesize speech."
          icon={Mic}
          actionLabel="Register New Voice"
          onAction={() => onNavigate('/voices/register')}
        />
      ) : (
        <>
          {/* Voice Selector Grid */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
            <VoiceSelector
              voices={voices}
              selectedVoiceId={selectedVoice?.id || null}
              onSelectVoice={(id) => {
                setSelectedVoiceId(id);
                clearError();
              }}
            />
          </div>

          {/* Text Input & Generation Form */}
          <GenerationForm
            selectedVoice={selectedVoice}
            isGenerating={isGenerating}
            error={error}
            onGenerate={handleGenerate}
          />

          {/* Generated Speech Output Audio Player */}
          {currentGeneration && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Generated Output</span>
              </div>
              <GenerationResult generation={currentGeneration} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
