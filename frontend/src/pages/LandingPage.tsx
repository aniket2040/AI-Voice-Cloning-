import React from 'react';
import {
  Mic,
  Sparkles,
  ArrowRight,
  AudioWaveform,
  Shield,
  Zap,
  Cpu,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { Waveform } from '../components/ui/Waveform';
import { AIStatusIndicator } from '../components/ui/AIStatusIndicator';
import { useAuth } from '../lib/auth/AuthContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const handleAction = (targetPath: string) => {
    if (!isAuthenticated) {
      onNavigate('/login');
    } else {
      onNavigate(targetPath);
    }
  };
  return (
    <div id="landing-page" className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4 space-y-6">
        {/* Futuristic Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Next-Gen Zero-Shot NeuTTS Neural Flow Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-sans leading-[1.1]">
          Clone Human Voice with{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Neural Precision
          </span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload reference speech, extract acoustic neural codebooks, and generate high-fidelity,
          emotionally nuanced speech synthesis in seconds.
        </p>

        {/* Waveform graphic teaser */}
        <div className="max-w-md mx-auto my-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <Waveform isPlaying={true} progress={0.65} height={44} barCount={40} seed="hero_speech" />
          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
            <span>Harmonic Resonator Active</span>
            <span className="text-cyan-400">0.24x Real-Time Factor</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            id="hero-create-voice-btn"
            type="button"
            onClick={() => handleAction('/voices/register')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Create New Voice</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-open-studio-btn"
            type="button"
            onClick={() => handleAction('/studio')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm border border-slate-700/80 transition-all cursor-pointer"
          >
            <span>Open Studio Dashboard</span>
          </button>
        </div>
      </section>

      {/* Workflow Visualization Section */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
            Pipeline Architecture
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans">
            How Neural Cloning Works
          </h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From raw vocal reference sample to expressive speech synthesis in five verified stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
          {[
            {
              step: '01',
              title: 'Audio Upload',
              desc: 'Reference file upload (.wav, .mp3, max 25MB) with transcript text validation.',
              icon: Mic,
            },
            {
              step: '02',
              title: 'Preprocessing',
              desc: 'Normalization, 24kHz resampling, and acoustic noise floor attenuation.',
              icon: Layers,
            },
            {
              step: '03',
              title: 'Neural Codebook',
              desc: 'NeuTTS reference encoder generates multidimensional acoustic embeddings.',
              icon: Cpu,
            },
            {
              step: '04',
              title: 'Voice Profile',
              desc: 'Speaker vector persisted into active library in READY status for generation.',
              icon: Shield,
            },
            {
              step: '05',
              title: 'Flow Synthesis',
              desc: 'Conditional flow matcher transforms text into high-fidelity speech waveform.',
              icon: Zap,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative group hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-3">
                    <span className="font-bold">{item.step}</span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1.5 font-sans">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400">
            System Features
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans">
            Engineered for Precision & Latency
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white">Sub-Second RTF Inference</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              NeuTTS flow matching architecture achieves 0.22x Real-Time Factor (RTF) on consumer GPUs, generating minutes of speech in seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mic className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white">Zero-Shot Reference Cloning</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize natural timbre and cadence with as little as 3 seconds of reference speech and matching transcript text.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white">Strict Ownership Abstraction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isolated user-scoped storage, status transition integrity, and audit logging built directly into the client abstraction layer.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-blue-950/60 border border-cyan-500/30 text-center space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to Build Your Neural Voice Studio?
          </h3>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Experience real-time speech synthesis, test custom voice samples, and inspect acoustic codebooks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleAction('/voices/register')}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              Start Voice Registration
            </button>
            <button
              type="button"
              onClick={() => handleAction('/generate')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700 cursor-pointer"
            >
              Test Text-to-Speech
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
