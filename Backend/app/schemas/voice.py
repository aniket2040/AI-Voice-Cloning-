from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.voice_profile import VoiceStatus


class VoiceRegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str

    processed_audio_path: str

    reference_codes_path: str | None = None
    reference_text: str | None = None

    status: VoiceStatus
    model: str
    created_at: datetime
    updated_at: datetime


class VoiceGenerationRequest(BaseModel):
    text: str


class VoiceGenerationResponse(BaseModel):
    id: UUID
    user_id: UUID
    voice_id: UUID
    input_text: str
    audio_path: str
    model: str
    generation_time: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VoiceSummaryResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    status: VoiceStatus
    model: str
    created_at: datetime
    updated_at: datetime


class VoiceDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    status: VoiceStatus
    model: str
    processed_audio_path: str | None = None
    reference_codes_path: str | None = None
    reference_text: str | None = None
    created_at: datetime
    updated_at: datetime