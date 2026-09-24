import React from 'react';
import { Mic2, Activity, Cpu, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="app-footer" className="w-full border-t border-slate-800/80 bg-slate-950/80 mt-16 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Mic2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-white tracking-wider">AI VOICE STUDIO</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Next-generation neural voice cloning architecture utilizing reference codebook encoding and flow-matching speech generation.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                NeuTTS Model Core
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Shot Synthesis
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold mb-3">
              Studio Views
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/studio')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Studio Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/voices')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Voice Library
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/voices/register')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Register New Voice
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/generate')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Text-to-Speech Generation
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold mb-3">
              Specifications
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li>Upload: WAV, MP3, FLAC (Max 25MB)</li>
              <li>Inference limit: 5,000 chars</li>
              <li>Engine: NeuTTS v1.2 Flow Matcher</li>
              <li>Security: JWT Bearer authentication</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            AI Voice Studio © {new Date().getFullYear()} • High-Fidelity Neural Cloning
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Authorized Audio Processing Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
