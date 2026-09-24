import { useState, useCallback } from 'react';
import { Generation, Voice } from '../lib/types';
import { generateSpeech, listGenerations, deleteGeneration } from '../lib/api/generations';

export function useGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await listGenerations();
      setHistory(data);
    } catch (err: unknown) {
      console.error('Failed to fetch generation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const generate = async (voiceId: string, text: string, voice?: Voice): Promise<Generation | null> => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateSpeech(voiceId, { text }, voice);
      if (res.error || !res.data) {
        setError(res.error || 'Speech generation failed');
        return null;
      }
      setCurrentGeneration(res.data);
      setHistory((prev) => [res.data!, ...prev.filter((g) => g.id !== res.data!.id)]);
      return res.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown generation error';
      setError(msg);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const removeHistoryItem = async (genId: string) => {
    await deleteGeneration(genId);
    setHistory((prev) => prev.filter((item) => item.id !== genId));
    if (currentGeneration?.id === genId) {
      setCurrentGeneration(null);
    }
  };

  return {
    isGenerating,
    currentGeneration,
    error,
    history,
    isLoadingHistory,
    generate,
    fetchHistory,
    removeHistoryItem,
    clearError: () => setError(null),
    resetCurrent: () => setCurrentGeneration(null),
  };
}
