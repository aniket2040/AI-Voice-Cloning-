import React from 'react';
import { Voice } from '../../lib/types';
import { Cpu, FileAudio, Database, Calendar, Hash, UserCheck, Activity } from 'lucide-react';

interface VoiceMetadataProps {
  voice: Voice;
  className?: string;
}

export const VoiceMetadata: React.FC<VoiceMetadataProps> = ({ voice, className = '' }) => {
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id={`voice-metadata-${voice.id}`}
      className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono ${className}`}
    >
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-2.5">
        <Cpu className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-slate-400 block text-[11px]">Model Architecture</span>
          <span className="text-slate-200 font-medium truncate block">
            {voice.model || 'NeuTTS'}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-2.5">
        <Activity className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-slate-400 block text-[11px]">Voice Status</span>
          <span className="text-emerald-400 font-bold uppercase truncate block">
            {voice.status}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-2.5">
        <Database className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-slate-400 block text-[11px]">Neural Reference Codes</span>
          <span className="text-slate-300 truncate block" title={voice.reference_codes_path || undefined}>
            {voice.reference_codes_path || 'Pending'}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-2.5">
        <FileAudio className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-slate-400 block text-[11px]">Processed Audio Path</span>
          <span className="text-slate-400 truncate block text-[11px]" title={voice.processed_audio_path || undefined}>
            {voice.processed_audio_path || 'N/A'}
          </span>
        </div>
      </div>

      {voice.user_id && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-2.5">
          <UserCheck className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 block text-[11px]">User ID (Owner)</span>
            <span className="text-slate-400 truncate block text-[11px]" title={voice.user_id}>
              {voice.user_id}
            </span>
          </div>
        </div>
      )}

      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-2.5">
        <Calendar className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-slate-400 block text-[11px]">Created Timestamp</span>
          <span className="text-slate-300 truncate block">
            {formatDate(voice.created_at)}
          </span>
        </div>
      </div>

      {voice.updated_at && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-2.5">
          <Calendar className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 block text-[11px]">Last Updated</span>
            <span className="text-slate-300 truncate block">
              {formatDate(voice.updated_at)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
