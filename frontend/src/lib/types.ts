/**
 * Backend Pydantic User Schema:
 * id: UUID
 * name: str
 * email: EmailStr
 * created_at: datetime
 */
export interface User {
  id: string; // UUID
  name: string;
  email: string;
  created_at?: string; // ISO datetime string
  // Aliases for compatibility
  username?: string;
  full_name?: string;
}

/**
 * Matches backend UserRegistrationRequest
 */
export interface UserRegistrationRequest {
  name: string; // Field(..., min_length=1, max_length=100)
  email: string; // EmailStr
  password: string; // Field(..., min_length=8, max_length=128)
}

/**
 * Matches backend UserRegistrationResponse
 */
export interface UserRegistrationResponse {
  id: string; // UUID
  name: string;
  email: string;
  created_at: string;
  // Optional token if backend includes it
  access_token?: string;
  token_type?: string;
}

/**
 * Matches backend UserLoginRequest
 */
export interface UserLoginRequest {
  email: string; // EmailStr
  password: string; // Field(..., min_length=8, max_length=128)
}

/**
 * Matches backend UserLoginResponse
 */
export interface UserLoginResponse {
  access_token: string;
  token_type?: string; // default "bearer"
}

/**
 * Matches backend CurrentUserResponse
 */
export interface CurrentUserResponse {
  id: string; // UUID
  name: string;
  email: string;
  created_at: string;
}

// Client Auth Response aliases
export interface AuthLoginResponse {
  access_token?: string;
  token?: string;
  token_type?: string;
  user?: User;
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  message?: string;
}

export interface AuthRegisterResponse {
  id?: string;
  name?: string;
  email?: string;
  created_at?: string;
  message?: string;
  access_token?: string;
  token?: string;
  token_type?: string;
  user?: User;
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  username?: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export type VoiceStatus =
  | 'IDLE'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'UPLOADING'
  | 'idle'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'uploading'
  | string;

/**
 * Backend Voice Schemas (FastAPI / Pydantic)
 */

/**
 * Matches backend VoiceRegistrationResponse
 */
export interface VoiceRegistrationResponse {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  processed_audio_path: string;
  reference_codes_path: string | null;
  reference_text: string | null;
  status: VoiceStatus;
  model: string;
  created_at: string; // datetime (ISO)
  updated_at: string; // datetime (ISO)
}

/**
 * Matches backend VoiceGenerationRequest
 */
export interface VoiceGenerationRequest {
  text: string;
}

/**
 * Matches backend VoiceGenerationResponse
 */
export interface VoiceGenerationResponse {
  id: string; // UUID
  user_id: string; // UUID
  voice_id: string; // UUID
  input_text: string;
  audio_path: string;
  model: string;
  generation_time: number; // float
  created_at: string; // datetime (ISO)
}

/**
 * Matches backend VoiceSummaryResponse
 */
export interface VoiceSummaryResponse {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  status: VoiceStatus;
  model: string;
  created_at: string; // datetime (ISO)
  updated_at: string; // datetime (ISO)
}

/**
 * Matches backend VoiceDetailResponse
 */
export interface VoiceDetailResponse {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  status: VoiceStatus;
  model: string;
  processed_audio_path: string | null;
  reference_codes_path: string | null;
  reference_text: string | null;
  created_at: string; // datetime (ISO)
  updated_at: string; // datetime (ISO)
}

/**
 * Client Voice representation unifying summary, detail, and registration
 */
export interface Voice {
  id: string; // UUID
  user_id?: string; // UUID
  name: string;
  status: VoiceStatus;
  model: string;
  processed_audio_path?: string | null;
  reference_codes_path?: string | null;
  reference_text?: string | null;
  created_at: string;
  updated_at?: string;

  // Frontend helper properties
  audio_url?: string;
  sample_duration?: number;
  file_format?: string;
  file_size?: number;
  error_message?: string;
}

/**
 * Client Generation representation matching VoiceGenerationResponse
 */
export interface Generation {
  id: string; // UUID
  user_id?: string; // UUID
  voice_id: string; // UUID
  input_text: string;
  audio_path: string;
  model: string;
  generation_time: number; // float
  created_at: string;

  // Frontend helper properties
  voice_name?: string;
  audio_url?: string;
  audio_duration?: number;
  rtf?: number; // Real-Time Factor
}

export interface TemporaryUploadResponse {
  status: 'uploaded' | 'failed' | string;
  message: string;
  temporary_file: string;
  size_bytes?: number;
  audio?: {
    duration?: number;
    sample_rate?: number;
    channels?: number;
    format?: string;
    [key: string]: unknown;
  } | null;
  // Compatibility fallbacks
  filename?: string;
  format?: string;
  size?: number;
  duration?: number;
}

export interface RegisterVoicePayload {
  voice_name: string;
  name?: string;
  reference_text?: string;
  temporary_file?: string;
  file?: File;
}

export interface GenerateSpeechPayload {
  text: string;
}

export interface BackendHealthResponse {
  status: 'ok' | 'healthy' | 'degraded' | 'offline';
  model?: string;
  version?: string;
  uptime?: number;
  device?: string;
  latency_ms?: number;
  mode?: 'live' | 'simulation';
}

export interface ApiError {
  message: string;
  detail?: string;
  status?: number;
}
