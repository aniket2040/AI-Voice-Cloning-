import { useState, useEffect, useCallback } from 'react';
import { Voice } from '../lib/types';
import { getVoiceDetails, deleteVoice } from '../lib/api/voices';

export function useVoice(voiceId: string | null | undefined) {
  const [voice, setVoice] = useState<Voice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoice = useCallback(async () => {
    if (!voiceId) {
      setVoice(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await getVoiceDetails(voiceId);
      if (res.error || !res.data) {
        setError(res.error || 'Voice not found');
        setVoice(null);
      } else {
        setVoice(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve voice details');
      setVoice(null);
    } finally {
      setIsLoading(false);
    }
  }, [voiceId]);

  useEffect(() => {
    fetchVoice();
  }, [fetchVoice]);

  const remove = async (): Promise<boolean> => {
    if (!voiceId) return false;
    const res = await deleteVoice(voiceId);
    return res.success;
  };

  return {
    voice,
    isLoading,
    error,
    refresh: fetchVoice,
    remove,
  };
}
