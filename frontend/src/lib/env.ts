/**
 * Centralized Environment Mapping
 * Maps all environment variables defined in .env and provides them for every API call.
 */

// Storage keys for runtime client overrides (fallback to .env values)
const API_URL_STORAGE_KEY = 'ai_voice_studio_api_url';
const API_KEY_STORAGE_KEY = 'ai_voice_studio_api_key';
const API_KEY_HEADER_STORAGE_KEY = 'ai_voice_studio_api_key_header';

// Raw env readings via Vite's import.meta.env
const RAW_ENV = (import.meta as unknown as { env: Record<string, string | undefined> })?.env || {};

/**
 * Returns the mapped Backend API Base URL from .env or local override
 */
export function getMappedApiUrl(): string {
  try {
    const stored = localStorage.getItem(API_URL_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim().replace(/\/+$/, '');
    }
  } catch {
    // localStorage unavailable
  }

  const envVal = RAW_ENV.VITE_API_URL;
  if (envVal && envVal.trim()) {
    return envVal.trim().replace(/\/+$/, '');
  }

  return 'http://localhost:8000';
}

export function setMappedApiUrl(url: string): void {
  const sanitized = url.trim().replace(/\/+$/, '');
  try {
    localStorage.setItem(API_URL_STORAGE_KEY, sanitized);
  } catch {
    // ignore
  }
}

export function resetMappedApiUrl(): string {
  try {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  } catch {
    // ignore
  }
  return getRawEnvApiUrl();
}

export function getRawEnvApiUrl(): string {
  const envVal = RAW_ENV.VITE_API_URL;
  if (envVal && envVal.trim()) {
    return envVal.trim().replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:8000';
}

/**
 * Returns the mapped optional API Key from .env or local override
 */
export function getMappedApiKey(): string {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored !== null && stored.trim().length > 0) {
      return stored.trim();
    }
  } catch {
    // localStorage unavailable
  }

  const envVal = RAW_ENV.VITE_API_KEY;
  if (envVal && envVal.trim()) {
    return envVal.trim();
  }

  return '';
}

export function setMappedApiKey(key: string): void {
  const sanitized = key.trim();
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, sanitized);
  } catch {
    // ignore
  }
}

/**
 * Returns the mapped HTTP Header name for the optional API Key
 */
export function getMappedApiKeyHeader(): string {
  try {
    const stored = localStorage.getItem(API_KEY_HEADER_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // localStorage unavailable
  }

  const envVal = RAW_ENV.VITE_API_KEY_HEADER;
  if (envVal && envVal.trim()) {
    return envVal.trim();
  }

  return 'X-API-Key';
}

export function setMappedApiKeyHeader(header: string): void {
  const sanitized = header.trim();
  try {
    localStorage.setItem(API_KEY_HEADER_STORAGE_KEY, sanitized);
  } catch {
    // ignore
  }
}

/**
 * Endpoint path mappings from .env
 */
export const API_ENDPOINTS = {
  // Authentication Endpoints
  AUTH_REGISTER: RAW_ENV.VITE_API_ENDPOINT_AUTH_REGISTER || '/api/auth/register',
  AUTH_LOGIN: RAW_ENV.VITE_API_ENDPOINT_AUTH_LOGIN || '/api/auth/login',
  AUTH_ME: RAW_ENV.VITE_API_ENDPOINT_AUTH_ME || '/api/auth/me',

  // Voice & Speech Endpoints
  HEALTH: RAW_ENV.VITE_API_ENDPOINT_HEALTH || '/health',
  UPLOAD: RAW_ENV.VITE_API_ENDPOINT_UPLOAD || '/api/voices/upload',
  REGISTER: RAW_ENV.VITE_API_ENDPOINT_REGISTER || '/api/voices/register',
  VOICES: RAW_ENV.VITE_API_ENDPOINT_VOICES || '/api/voices',

  // Voice Generation Templates
  GENERATE: RAW_ENV.VITE_API_ENDPOINT_GENERATE || '/api/voices/{voice_id}/generate',
  GENERATION_AUDIO:
    RAW_ENV.VITE_API_ENDPOINT_GENERATION_AUDIO ||
    '/api/voices/{voice_id}/generations/{generation_id}/audio',

  // Dynamic Route Generators
  voiceList: () => `${RAW_ENV.VITE_API_ENDPOINT_VOICES || '/api/voices'}`,
  voiceDetail: (voiceId: string) =>
    `${RAW_ENV.VITE_API_ENDPOINT_VOICES || '/api/voices'}/${encodeURIComponent(voiceId)}`,
  voiceDelete: (voiceId: string) =>
    `${RAW_ENV.VITE_API_ENDPOINT_VOICES || '/api/voices'}/${encodeURIComponent(voiceId)}`,
  voiceGenerate: (voiceId: string) => {
    const template = RAW_ENV.VITE_API_ENDPOINT_GENERATE || '/api/voices/{voice_id}/generate';
    return template.replace('{voice_id}', encodeURIComponent(voiceId));
  },
  generationAudio: (voiceId: string, generationId: string) => {
    const template =
      RAW_ENV.VITE_API_ENDPOINT_GENERATION_AUDIO ||
      '/api/voices/{voice_id}/generations/{generation_id}/audio';
    return template
      .replace('{voice_id}', encodeURIComponent(voiceId))
      .replace('{generation_id}', encodeURIComponent(generationId));
  },
};
