import { useState, useEffect, useCallback } from 'react';
import { Voice } from '../lib/types';
import { listVoices, deleteVoice } from '../lib/api/voices';

export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listVoices();
      if (res.error) {
        setError(res.error);
      } else {
        setVoices(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const removeVoice = async (voiceId: string): Promise<boolean> => {
    const res = await deleteVoice(voiceId);
    if (res.success) {
      setVoices((prev) => prev.filter((v) => v.id !== voiceId));
      return true;
    }
    setError(res.error || 'Failed to delete voice');
    return false;
  };

  const readyVoices = voices.filter((v) => (v.status || '').toUpperCase() === 'READY');

  return {
    voices,
    readyVoices,
    isLoading,
    error,
    refresh: fetchVoices,
    removeVoice,
  };
}
