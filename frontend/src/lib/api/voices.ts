import { apiClient, resolveAudioUrl } from './client';
import {
  Voice,
  TemporaryUploadResponse,
  RegisterVoicePayload,
  VoiceRegistrationResponse,
  VoiceSummaryResponse,
  VoiceDetailResponse,
} from '../types';
import { MAX_AUDIO_SIZE_BYTES, ACCEPTED_AUDIO_EXTENSIONS } from '../constants';
import { API_ENDPOINTS } from '../env';

const VOICES_LOCAL_STORAGE_KEY = 'ai_voice_studio_local_voices';
const DUMMY_VOICE_IDS = new Set(['voice_aria_01', 'voice_nexus_02', 'voice_sol_03']);

/**
 * Returns any locally cached voices that came from real backend interactions,
 * filtering out any legacy dummy seed voices.
 */
export function getStoredVoices(): Voice[] {
  try {
    const raw = localStorage.getItem(VOICES_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: Voice[] = JSON.parse(raw);
      const filtered = parsed.filter((v) => !DUMMY_VOICE_IDS.has(v.id));
      if (filtered.length !== parsed.length) {
        saveStoredVoices(filtered);
      }
      return filtered;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredVoices(voices: Voice[]): void {
  try {
    const clean = voices.filter((v) => !DUMMY_VOICE_IDS.has(v.id));
    localStorage.setItem(VOICES_LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to save voices to localStorage:', err);
  }
}

/**
 * 1. Upload Temporary Audio File
 * Calls POST /api/voices/upload with multipart/form-data
 */
export async function uploadVoiceAudio(
  file: File
): Promise<{ data: TemporaryUploadResponse | null; error: string | null; status: number }> {
  // Validate size
  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return {
      data: null,
      error: `File exceeds maximum allowed size of 25MB (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      status: 400,
    };
  }

  // Validate extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ACCEPTED_AUDIO_EXTENSIONS.includes(extension)) {
    return {
      data: null,
      error: `Unsupported audio format ${extension}. Allowed formats: ${ACCEPTED_AUDIO_EXTENSIONS.join(', ')}`,
      status: 400,
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  const result = await apiClient<TemporaryUploadResponse>(API_ENDPOINTS.UPLOAD, {
    method: 'POST',
    body: formData,
    timeoutMs: 60000,
  });

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error || 'Failed to upload audio file to backend',
      status: result.status,
    };
  }

  // Check if backend returned explicit failure status
  if (result.data.status === 'failed') {
    return {
      data: null,
      error: result.data.message || 'Audio upload was rejected by backend.',
      status: 400,
    };
  }

  // Normalize temporary_file key across different backend response formats
  const rawObj = result.data as unknown as Record<string, unknown>;
  const resolvedFileName =
    typeof result.data === 'string'
      ? result.data
      : (rawObj.temporary_file ||
          rawObj.filename ||
          rawObj.temp_filename ||
          rawObj.temporary_filename ||
          rawObj.file ||
          rawObj.path ||
          '') as string;

  const normalized: TemporaryUploadResponse = {
    status: result.data.status || 'uploaded',
    message: result.data.message || 'Voice sample uploaded successfully.',
    temporary_file: resolvedFileName || result.data.temporary_file,
    size_bytes: result.data.size_bytes,
    audio: result.data.audio,
  };

  return { data: normalized, error: null, status: result.status };
}

/**
 * 2. Register Voice Profile
 * Calls POST /api/voices/register
 * 
 * FastAPI endpoint signature:
 * @router.post("/register", response_model=VoiceRegistrationResponse, status_code=status.HTTP_201_CREATED)
 * async def register_voice(
 *     request: Request,
 *     voice_name: str = Form(...),
 *     temporary_file: str = Form(...),
 *     reference_text: str = Form(...),
 *     current_user: User = Depends(get_current_user),
 *     db: AsyncSession = Depends(get_db),
 * )
 *
 * Parameters are sent as Form data (multipart/form-data).
 * The audio is NOT uploaded again; it references the already-uploaded temporary_file.
 * filename = Path(temporary_file).name (checked on backend: filename == temporary_file)
 */
export async function registerVoice(
  payload: RegisterVoicePayload
): Promise<{ data: Voice | null; error: string | null }> {
  const voiceName = (payload.voice_name || payload.name || '').trim();
  if (!voiceName) {
    return { data: null, error: 'Voice name is required' };
  }

  const referenceText = (payload.reference_text || '').trim();
  if (!referenceText) {
    return { data: null, error: 'Reference transcript text is required' };
  }

  const rawTemp = (payload.temporary_file || '').trim();
  if (!rawTemp) {
    return {
      data: null,
      error: 'Temporary file is missing. The reference audio must be uploaded first.',
    };
  }

  // Ensure pure base filename without directory separators
  // to satisfy backend requirement: Path(temporary_file).name == temporary_file
  const cleanTempFile = rawTemp.split(/[\\/]/).pop() || rawTemp;

  // Build FormData for FastAPI Form(...) fields
  const formData = new FormData();
  formData.append('voice_name', voiceName);
  formData.append('temporary_file', cleanTempFile);
  formData.append('reference_text', referenceText);

  // Call POST /api/voices/register with Form data and 90s timeout for neural processing
  const result = await apiClient<VoiceRegistrationResponse>(API_ENDPOINTS.REGISTER, {
    method: 'POST',
    body: formData,
    timeoutMs: 90000,
  });

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error || 'Voice registration failed on backend',
    };
  }

  const registeredVoice: Voice = {
    id: String(result.data.id),
    user_id: String(result.data.user_id),
    name: result.data.name,
    processed_audio_path: result.data.processed_audio_path,
    reference_codes_path: result.data.reference_codes_path,
    reference_text: result.data.reference_text || referenceText,
    status: result.data.status,
    model: result.data.model || 'neutts',
    created_at: result.data.created_at,
    updated_at: result.data.updated_at,
    audio_url: resolveAudioUrl(result.data.processed_audio_path),
  };

  // Cache in local store
  const voices = getStoredVoices();
  saveStoredVoices([
    registeredVoice,
    ...voices.filter((v) => v.id !== registeredVoice.id),
  ]);

  return { data: registeredVoice, error: null };
}

/**
 * 3. List Voices
 * Calls GET /api/voices
 * Response: VoiceSummaryResponse[]
 */
export async function listVoices(): Promise<{ data: Voice[]; error: string | null }> {
  const result = await apiClient<VoiceSummaryResponse[]>(API_ENDPOINTS.voiceList());

  if (result.data && Array.isArray(result.data)) {
    const existingVoices = getStoredVoices();
    const existingMap = new Map(existingVoices.map((v) => [v.id, v]));

    const resolved: Voice[] = result.data.map((v) => {
      const existing = existingMap.get(String(v.id));
      const processedPath = (v as Partial<VoiceDetailResponse>).processed_audio_path || existing?.processed_audio_path || null;
      return {
        id: String(v.id),
        user_id: String(v.user_id),
        name: v.name,
        status: v.status,
        model: v.model,
        processed_audio_path: processedPath,
        reference_codes_path: (v as Partial<VoiceDetailResponse>).reference_codes_path || existing?.reference_codes_path || null,
        reference_text: (v as Partial<VoiceDetailResponse>).reference_text || existing?.reference_text || null,
        created_at: v.created_at,
        updated_at: v.updated_at,
        audio_url: resolveAudioUrl(processedPath || existing?.audio_url),
      };
    });
    saveStoredVoices(resolved);
    return { data: resolved, error: null };
  }

  // If backend is currently offline, return cached local voices (if any) or empty list
  const cached = getStoredVoices();
  return {
    data: cached,
    error: result.error,
  };
}

/**
 * 4. Get Voice Details
 * Calls GET /api/voices/{voice_id}
 * Response: VoiceDetailResponse
 */
export async function getVoiceDetails(
  voiceId: string
): Promise<{ data: Voice | null; error: string | null }> {
  const result = await apiClient<VoiceDetailResponse>(API_ENDPOINTS.voiceDetail(voiceId));

  if (result.data) {
    const resolved: Voice = {
      id: String(result.data.id),
      user_id: String(result.data.user_id),
      name: result.data.name,
      status: result.data.status,
      model: result.data.model,
      processed_audio_path: result.data.processed_audio_path,
      reference_codes_path: result.data.reference_codes_path,
      reference_text: result.data.reference_text,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at,
      audio_url: resolveAudioUrl(
        result.data.processed_audio_path || (result.data as { audio_url?: string }).audio_url
      ),
    };

    // Update in local cache with full details
    const stored = getStoredVoices();
    saveStoredVoices([
      resolved,
      ...stored.filter((v) => v.id !== resolved.id),
    ]);

    return { data: resolved, error: null };
  }

  // Check local cache if backend is unreachable
  const voices = getStoredVoices();
  const found = voices.find((v) => v.id === voiceId);
  if (found) {
    return { data: found, error: null };
  }

  return {
    data: null,
    error: result.error || `Voice with ID '${voiceId}' not found.`,
  };
}

/**
 * 5. Delete Voice
 * Calls DELETE /api/voices/{voice_id}
 * (User is identified via JWT Bearer token)
 */
export async function deleteVoice(
  voiceId: string
): Promise<{ success: boolean; error: string | null }> {
  const result = await apiClient<{ message?: string; success?: boolean }>(
    API_ENDPOINTS.voiceDelete(voiceId),
    { method: 'DELETE' }
  );

  // Update local cache
  const stored = getStoredVoices();
  saveStoredVoices(stored.filter((v) => v.id !== voiceId));

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, error: null };
}
