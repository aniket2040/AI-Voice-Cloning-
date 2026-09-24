import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { VoiceCard } from '../components/voice/VoiceCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useVoices } from '../hooks/useVoices';
import { Voice } from '../lib/types';
import { Mic, PlusCircle, Search, Filter, RefreshCw } from 'lucide-react';

interface VoicesListPageProps {
  onNavigate: (path: string) => void;
}

export const VoicesListPage: React.FC<VoicesListPageProps> = ({ onNavigate }) => {
  const { voices, readyVoices, isLoading, removeVoice, refresh } = useVoices();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'PROCESSING'>('ALL');
  const [voiceToDelete, setVoiceToDelete] = useState<Voice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredVoices = voices.filter((voice) => {
    const matchesSearch =
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (voice.reference_text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.model.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return (voice.status || '').toUpperCase() === statusFilter.toUpperCase();
  });

  const handleDeleteConfirm = async () => {
    if (!voiceToDelete) return;
    setIsDeleting(true);
    await removeVoice(voiceToDelete.id);
    setIsDeleting(false);
    setVoiceToDelete(null);
  };

  return (
    <div id="voices-list-page" className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Voice Library"
        subtitle="Browse, inspect, and manage registered neural voice profiles. Select any READY voice to synthesize text."
        icon={Mic}
        badge={`${readyVoices.length} READY / ${voices.length} Total`}
        actions={
          <button
            id="voices-page-register-btn"
            type="button"
            onClick={() => onNavigate('/voices/register')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Voice</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="voices-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voices by name or text..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({voices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('READY')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'READY'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              READY ({readyVoices.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => refresh()}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors border border-slate-700 cursor-pointer"
            title="Refresh voice library"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton count={6} className="h-60" />
        </div>
      ) : filteredVoices.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching voices found' : 'No voices in library'}
          description={
            searchQuery
              ? `No voice profiles matched "${searchQuery}". Try a different keyword.`
              : 'Register your first reference voice audio to begin neural cloning.'
          }
          icon={Mic}
          actionLabel={searchQuery ? 'Clear Search' : 'Register Voice'}
          onAction={() => {
            if (searchQuery) setSearchQuery('');
            else onNavigate('/voices/register');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVoices.map((voice) => (
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!voiceToDelete}
        title="Delete Voice Profile"
        message={`Are you sure you want to permanently delete "${voiceToDelete?.name}"? All encoded reference codes and temporary audio files will be removed from your profile.`}
        confirmLabel="Confirm Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setVoiceToDelete(null)}
      />
    </div>
  );
};
