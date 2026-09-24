import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { AudioDropzone } from '../components/forms/AudioDropzone';
import { CharacterCounter } from '../components/forms/CharacterCounter';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AudioVisualizer } from '../components/ui/AudioVisualizer';
import { uploadVoiceAudio, registerVoice } from '../lib/api/voices';
import { Voice, TemporaryUploadResponse } from '../lib/types';
import { SAMPLE_REFERENCE_TEXTS } from '../lib/constants';
import {
  Mic,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  FileCheck,
} from 'lucide-react';

interface VoiceRegisterPageProps {
  onNavigate: (path: string) => void;
}

type RegistrationStep = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';

export const VoiceRegisterPage: React.FC<VoiceRegisterPageProps> = ({ onNavigate }) => {
  // Form State
  const [voiceName, setVoiceName] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  // Flow State
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('IDLE');
  const [stepDetail, setStepDetail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdVoice, setCreatedVoice] = useState<Voice | null>(null);

  const handleFileSelected = (file: File, previewUrl: string) => {
    setAudioFile(file);
    setAudioPreviewUrl(previewUrl);
    setErrorMessage(null);

    // Auto-suggest name from filename if not yet filled
    if (!voiceName) {
      const suggested = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setVoiceName(suggested);
    }
  };

  const handleClearFile = () => {
    setAudioFile(null);
    setAudioPreviewUrl(null);
  };

  const handleApplySampleText = (text: string) => {
    setReferenceText(text);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setErrorMessage('Please select or drop an audio reference file.');
      return;
    }
    if (!voiceName.trim()) {
      setErrorMessage('Please provide a descriptive name for this voice.');
      return;
    }
    if (!referenceText.trim()) {
      setErrorMessage('Reference transcript text is required for neural alignment.');
      return;
    }

    setErrorMessage(null);

    try {
      // Step 1: Upload temporary audio to backend
      setCurrentStep('UPLOADING');
      setStepDetail('Uploading reference audio sample to backend temporary storage...');

      const uploadResult = await uploadVoiceAudio(audioFile);
      if (uploadResult.error || !uploadResult.data?.temporary_file) {
        throw new Error(uploadResult.error || 'Failed to upload reference audio sample.');
      }

      const tempFile = uploadResult.data.temporary_file;

      // Step 2: Register voice with NeuTTS service (audio is NOT uploaded again)
      setCurrentStep('PROCESSING');
      setStepDetail('NeuTTS service is extracting acoustic spectrogram features and registering voice profile...');

      const registerResult = await registerVoice({
        voice_name: voiceName.trim(),
        temporary_file: tempFile,
        reference_text: referenceText.trim(),
      });

      if (registerResult.error || !registerResult.data) {
        throw new Error(registerResult.error || 'Registration failed on backend.');
      }

      setCreatedVoice(registerResult.data);
      setCurrentStep('READY');
      setStepDetail('Voice profile registered and ready for zero-shot synthesis.');
    } catch (err: unknown) {
      setCurrentStep('FAILED');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred during voice registration.');
    }
  };

  const isFormValid = audioFile && voiceName.trim().length > 0 && referenceText.trim().length > 0;
  const isBusy = currentStep === 'UPLOADING' || currentStep === 'PROCESSING';

  return (
    <div id="voice-registration-page" className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Register New Voice"
        subtitle="Upload a clean audio sample and matching transcript to generate a zero-shot neural voice profile."
        icon={Mic}
        badge="Zero-Shot Encoder"
      />

      {/* Progress / Step indicator bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span>PIPELINE SEQUENCE</span>
          <span className="text-cyan-400 font-semibold">{currentStep}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '1. Upload', active: currentStep !== 'IDLE' },
            { label: '2. Preprocess', active: currentStep === 'PROCESSING' || currentStep === 'READY' },
            { label: '3. Neural Encode', active: currentStep === 'PROCESSING' || currentStep === 'READY' },
            { label: '4. Voice READY', active: currentStep === 'READY' },
          ].map((st, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                st.active
                  ? currentStep === 'FAILED'
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* SUCCESS STATE */}
      {currentStep === 'READY' && createdVoice && (
        <div
          id="registration-success-card"
          className="p-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-xl space-y-6 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Voice Profile Registered & READY!
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Voice <strong className="text-emerald-300">{createdVoice.name}</strong> has been encoded with reference codebooks and is ready for text-to-speech generation.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Voice ID:</span>
              <span className="text-slate-200">{createdVoice.id}</span>
            </div>
            {createdVoice.user_id && (
              <div className="flex justify-between text-slate-400">
                <span>User ID:</span>
                <span className="text-slate-300">{createdVoice.user_id}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Model Architecture:</span>
              <span className="text-cyan-300">{createdVoice.model}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold uppercase">{createdVoice.status}</span>
            </div>
            {createdVoice.processed_audio_path && (
              <div className="flex justify-between text-slate-400">
                <span>Audio Path:</span>
                <span className="text-slate-300 truncate max-w-[240px]" title={createdVoice.processed_audio_path}>
                  {createdVoice.processed_audio_path}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="success-generate-speech-btn"
              type="button"
              onClick={() => onNavigate(`/voices/${createdVoice.id}/generate`)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Synthesize Speech With This Voice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="success-view-voices-btn"
              type="button"
              onClick={() => onNavigate('/voices')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              Go to Voice Library
            </button>
          </div>
        </div>
      )}

      {/* FORM INPUT STATE */}
      {currentStep !== 'READY' && (
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Step 1: Audio Dropzone */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                Step 1: Upload Reference Audio
              </label>
              <span className="text-xs font-mono text-slate-400">Max 25MB</span>
            </div>

            <AudioDropzone
              selectedFile={audioFile}
              previewUrl={audioPreviewUrl}
              onFileSelected={handleFileSelected}
              onClear={handleClearFile}
            />
          </div>

          {/* Step 2: Voice Name */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
            <label
              htmlFor="voice-name-input"
              className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider block"
            >
              Step 2: Voice Profile Name
            </label>
            <input
              id="voice-name-input"
              type="text"
              disabled={isBusy}
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g. Commander Thorne, Maya Warm Narrator, Studio Echo"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm font-sans focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50"
            />
          </div>

          {/* Step 3: Reference Transcript */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reference-text-input"
                className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider block"
              >
                Step 3: Reference Transcript Text
              </label>
              <CharacterCounter current={referenceText.length} max={1000} />
            </div>

            <p className="text-xs text-slate-400">
              Provide the exact spoken text from the audio sample. This enables NeuTTS to align phonetic durations with acoustic spectrograms.
            </p>

            <textarea
              id="reference-text-input"
              rows={3}
              disabled={isBusy}
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="Type or paste the transcript spoken in the reference audio sample..."
              className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm font-sans focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-y disabled:opacity-50"
            />

            {/* Quick samples */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-slate-400">Suggested Transcripts:</span>
              {SAMPLE_REFERENCE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleApplySampleText(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors border border-slate-700/60 cursor-pointer disabled:opacity-40"
                >
                  Prompt {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Processing / Busy Banner */}
          {isBusy && (
            <div
              id="registration-processing-indicator"
              className="p-6 rounded-2xl border border-cyan-500/40 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center gap-3 text-center"
            >
              <AudioVisualizer active={true} barCount={20} />
              <LoadingSpinner size="md" label={stepDetail} />
              <p className="text-xs text-slate-400 max-w-sm">
                Please wait while NeuTTS processes the audio sample and encodes neural reference codebooks.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Register Action CTA */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onNavigate('/voices')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              id="submit-register-voice-btn"
              type="submit"
              disabled={!isFormValid || isBusy}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isFormValid && !isBusy
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Register & Encode Voice</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
