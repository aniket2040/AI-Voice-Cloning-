import { BackendHealthResponse } from '../types';
import {
  getMappedApiUrl,
  setMappedApiUrl,
  resetMappedApiUrl,
  getRawEnvApiUrl,
  getMappedApiKey,
  setMappedApiKey,
  getMappedApiKeyHeader,
  setMappedApiKeyHeader,
  API_ENDPOINTS,
} from '../env';
import { getAuthToken, setAuthToken } from '../auth/AuthContext';

export {
  getMappedApiUrl as getApiBaseUrl,
  setMappedApiUrl as setApiBaseUrl,
  resetMappedApiUrl,
  getRawEnvApiUrl,
  getMappedApiKey,
  setMappedApiKey,
  getMappedApiKeyHeader,
  setMappedApiKeyHeader,
  API_ENDPOINTS,
};

/**
 * Resolves an audio URL or relative path from the backend into a fully playable URL.
 * Also supports resolving voiceId + generationId to:
 * /api/voices/{voice_id}/generations/{generation_id}/audio
 */
export function resolveAudioUrl(
  pathOrUrl: string | undefined,
  voiceId?: string,
  generationId?: string
): string | undefined {
  const baseUrl = getMappedApiUrl();

  // If specific voiceId and generationId are provided, generate the exact API route
  if (voiceId && generationId) {
    return `${baseUrl}${API_ENDPOINTS.generationAudio(voiceId, generationId)}`;
  }

  if (!pathOrUrl) return undefined;
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }

  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Standardized fetch wrapper with timeout, error handling, JSON parsing,
 * automatic JWT Bearer token authentication, and API key header support.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const baseUrl = getMappedApiUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Retrieve JWT Bearer token if user is logged in
  const jwtToken = getAuthToken();

  // Retrieve mapped API key and header name from environment
  const apiKey = getMappedApiKey();
  const apiKeyHeader = getMappedApiKeyHeader();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 1. Inject JWT Bearer Token if user is logged in
  if (jwtToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  // 2. Inject mapped API Key header if not already provided
  if (apiKey && !headers[apiKeyHeader]) {
    headers[apiKeyHeader] = apiKey;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const timeoutMs = options.timeoutMs ?? 45000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions = { ...options };
  delete fetchOptions.timeoutMs;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If 401 Unauthorized, notify application about expired/invalid JWT
    if (response.status === 401 && jwtToken) {
      console.warn('Received 401 Unauthorized. Session has expired.');
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent('ai_voice_studio_auth_expired'));
    }

    const contentType = response.headers.get('content-type');
    let responseData: unknown = null;

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      responseData = null;
    } else if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : null;
      } catch {
        responseData = text;
      }
    }

    if (!response.ok) {
      let errorMsg = `Backend returned status ${response.status}`;
      if (responseData && typeof responseData === 'object') {
        const obj = responseData as Record<string, unknown>;
        if (typeof obj.detail === 'string') errorMsg = obj.detail;
        else if (typeof obj.message === 'string') errorMsg = obj.message;
        else if (Array.isArray(obj.detail)) {
          errorMsg = obj.detail
            .map((d: Record<string, unknown>) => d.msg || JSON.stringify(d))
            .join(', ');
        }
      }
      return { data: null, error: errorMsg, status: response.status };
    }

    return { data: responseData as T, error: null, status: response.status };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    let errMsg = `Unable to connect to backend at ${baseUrl}. Ensure your API server is running and CORS is enabled.`;

    const isClientHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isTargetHttp = baseUrl.startsWith('http://');

    if (isClientHttps && isTargetHttp) {
      errMsg = `Mixed Content Blocked: This web app is running securely over HTTPS (${window.location.origin}), but the backend is insecure HTTP (${baseUrl}). Web browsers block direct HTTP requests from HTTPS pages. Use a tunnel like 'ngrok http 8000' or allow Insecure Content in your browser site settings.`;
    } else if (err instanceof Error) {
      if (err.name === 'AbortError') {
        errMsg = `Request to ${url} timed out after ${(timeoutMs / 1000).toFixed(0)} seconds.`;
      }
    }
    return { data: null, error: errMsg, status: 0 };
  }
}

/**
 * Checks backend health using mapped HEALTH endpoint
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  const startTime = performance.now();
  const result = await apiClient<BackendHealthResponse>(API_ENDPOINTS.HEALTH);
  const latency = Math.round(performance.now() - startTime);

  if (!result.error && result.data) {
    return {
      ...result.data,
      latency_ms: latency,
      mode: 'live',
    };
  }

  return {
    status: 'offline',
    latency_ms: latency,
    mode: 'simulation',
  };
}

/**
 * Loads an audio file with JWT Bearer authentication headers,
 * converting the response into a local Blob URL for HTML5 <audio> elements.
 */
export async function fetchAuthenticatedAudioBlob(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const jwtToken = getAuthToken();
  const apiKey = getMappedApiKey();
  const apiKeyHeader = getMappedApiKeyHeader();

  const headers: Record<string, string> = {};
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }
  if (apiKey) {
    headers[apiKeyHeader] = apiKey;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load audio stream (${response.status})`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

