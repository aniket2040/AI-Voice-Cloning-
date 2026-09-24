import { apiClient, resolveAudioUrl } from './client';
import {
  Generation,
  GenerateSpeechPayload,
  Voice,
  VoiceGenerationRequest,
  VoiceGenerationResponse,
} from '../types';
import { MAX_TEXT_CHARACTERS } from '../constants';
import { getStoredVoices } from './voices';
import { API_ENDPOINTS } from '../env';

const GENERATIONS_LOCAL_STORAGE_KEY = 'ai_voice_studio_generations';
const DUMMY_GEN_IDS = new Set(['gen_alpha_01', 'gen_nexus_02']);

/**
 * Returns locally cached generations that were returned by the backend API,
 * filtering out any dummy seed items.
 */
export function getStoredGenerations(): Generation[] {
  try {
    const raw = localStorage.getItem(GENERATIONS_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: Generation[] = JSON.parse(raw);
      const filtered = parsed.filter((g) => !DUMMY_GEN_IDS.has(g.id));
      if (filtered.length !== parsed.length) {
        saveStoredGenerations(filtered);
      }
      return filtered;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredGenerations(generations: Generation[]): void {
  try {
    const clean = generations.filter((g) => !DUMMY_GEN_IDS.has(g.id));
    localStorage.setItem(GENERATIONS_LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to save generations:', err);
  }
}

/**
 * Generate speech from text using the selected voice
 * Calls POST /api/voices/{voice_id}/generate
 * Request Body: VoiceGenerationRequest { text: str }
 * Response: VoiceGenerationResponse { id, user_id, voice_id, input_text, audio_path, model, generation_time, created_at }
 */
export async function generateSpeech(
  voiceId: string,
  payload: GenerateSpeechPayload | VoiceGenerationRequest,
  activeVoice?: Voice
): Promise<{ data: Generation | null; error: string | null }> {
  const trimmed = payload.text.trim();

  // 1. Empty text validation
  if (!trimmed) {
    return { data: null, error: 'Text prompt cannot be empty.' };
  }

  // 2. Maximum characters validation
  if (trimmed.length > MAX_TEXT_CHARACTERS) {
    return {
      data: null,
      error: `Text length (${trimmed.length} chars) exceeds the maximum limit of ${MAX_TEXT_CHARACTERS} characters.`,
    };
  }

  // 3. Lookup voice if available for local display context
  const targetVoice = activeVoice || getStoredVoices().find((v) => v.id === voiceId);

  // Call mapped backend endpoint: POST /api/voices/{voice_id}/generate with Bearer JWT
  const requestBody: VoiceGenerationRequest = { text: trimmed };
  const result = await apiClient<VoiceGenerationResponse>(API_ENDPOINTS.voiceGenerate(voiceId), {
    method: 'POST',
    body: JSON.stringify(requestBody),
    timeoutMs: 60000,
  });

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error || 'Speech generation failed on backend.',
    };
  }

  const raw = result.data;
  // Route audio streaming through canonical GET /api/voices/{voice_id}/generations/{generation_id}/audio
  const audioUrl =
    raw.audio_path && (raw.audio_path.startsWith('http://') || raw.audio_path.startsWith('https://'))
      ? raw.audio_path
      : resolveAudioUrl(undefined, voiceId, String(raw.id));

  const genData: Generation = {
    id: String(raw.id),
    user_id: String(raw.user_id),
    voice_id: String(raw.voice_id),
    input_text: raw.input_text,
    audio_path: raw.audio_path,
    model: raw.model,
    generation_time:
      typeof raw.generation_time === 'number'
        ? raw.generation_time
        : Number(raw.generation_time || 0),
    created_at: raw.created_at,
    voice_name: targetVoice?.name || 'Neural Voice',
    audio_url: audioUrl,
  };

  // Cache generation in local session history
  const history = getStoredGenerations();
  saveStoredGenerations([genData, ...history.filter((g) => g.id !== genData.id)]);

  return { data: genData, error: null };
}

/**
 * List past generations
 */
export async function listGenerations(): Promise<Generation[]> {
  return getStoredGenerations();
}

/**
 * Delete a generation record
 */
export async function deleteGeneration(generationId: string): Promise<boolean> {
  const current = getStoredGenerations();
  const filtered = current.filter((g) => g.id !== generationId);
  saveStoredGenerations(filtered);
  return true;
}
