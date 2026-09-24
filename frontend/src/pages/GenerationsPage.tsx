import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useGeneration } from '../hooks/useGeneration';
import { Generation } from '../lib/types';
import { History, Sparkles, Trash2, Search, Wand2, Clock, Zap } from 'lucide-react';

interface GenerationsPageProps {
  onNavigate: (path: string) => void;
}

export const GenerationsPage: React.FC<GenerationsPageProps> = ({ onNavigate }) => {
  const { history, isLoadingHistory, fetchHistory, removeHistoryItem } = useGeneration();
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Generation | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = history.filter((item) => {
    return (
      item.input_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.voice_name && item.voice_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await removeHistoryItem(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <div id="generations-history-page" className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Generation History"
        subtitle="Review previously synthesized audio, inspect inference latency, and playback cloned voice tracks."
        icon={History}
        badge={`${history.length} Clips`}
        actions={
          <button
            type="button"
            onClick={() => onNavigate('/generate')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>New Speech Synthesis</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="generations-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts or voice names..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        <span className="text-xs font-mono text-slate-400 hidden sm:inline">
          Showing {filteredHistory.length} of {history.length}
        </span>
      </div>

      {/* History Items List */}
      {isLoadingHistory ? (
        <div className="space-y-4">
          <Skeleton count={3} className="h-40" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching audio clips found' : 'No synthesis history yet'}
          description={
            searchQuery
              ? `No generation records matched "${searchQuery}".`
              : 'Synthesize speech from text using any of your registered READY voices.'
          }
          icon={Sparkles}
          actionLabel={searchQuery ? 'Clear Search' : 'Synthesize Speech'}
          onAction={() => {
            if (searchQuery) setSearchQuery('');
            else onNavigate('/generate');
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 backdrop-blur-xl transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-white">
                      {item.voice_name || 'Cloned Voice'}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {item.model || 'NeuTTS v1.2'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {item.generation_time.toFixed(2)}s inference
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {item.rtf ? `${item.rtf.toFixed(2)}x RTF` : '0.22x RTF'}
                    </span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setItemToDelete(item)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Delete generation clip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Transcript text */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 text-xs text-slate-200 leading-relaxed font-sans">
                "{item.input_text}"
              </div>

              {/* Playable audio */}
              <AudioPlayer
                src={item.audio_url}
                title={item.voice_name}
                subtitle={`ID: ${item.id}`}
                seed={item.id}
                downloadFilename={`speech_${item.id}.wav`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Delete Generation Clip"
        message="Are you sure you want to remove this synthesized audio clip from your history?"
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
