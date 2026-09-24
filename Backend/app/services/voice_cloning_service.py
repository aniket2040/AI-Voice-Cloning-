import time
from pathlib import Path
from uuid import UUID, uuid4

import soundfile as sf

from app.models.voice_profile import VoiceStatus
from app.repositories.generation_repository import GenerationRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.services.neutts_service import NeuTTSService
from app.services.voice_storage import VoiceStorageService


class VoiceCloningError(Exception):
    """Raised when voice cloning fails."""


class VoiceCloningService:
    def __init__(
        self,
        voice_profile_repository: VoiceProfileRepository,
        generation_repository: GenerationRepository,
        voice_storage: VoiceStorageService,
        neutts_service: NeuTTSService,
    ):
        self.voice_profile_repository = voice_profile_repository
        self.generation_repository = generation_repository
        self.voice_storage = voice_storage
        self.neutts_service = neutts_service

    async def generate_speech(
        self,
        user_id: UUID,
        voice_id: UUID,
        input_text: str,
    ):
        input_text = input_text.strip()

        if not input_text:
            raise VoiceCloningError(
                "Input text cannot be empty."
            )

        if len(input_text) > 5000:
            raise VoiceCloningError(
                "Input text is too long. Maximum length is 5000 characters."
            )

        voice_profile = await self.voice_profile_repository.get_by_id(
            voice_id=voice_id,
            user_id=user_id,
        )

        if voice_profile is None:
            raise VoiceCloningError("Voice profile not found.")

        if voice_profile.status != VoiceStatus.READY:
            raise VoiceCloningError(
                "Voice profile is not ready for generation."
            )

        if not voice_profile.reference_codes_path:
            raise VoiceCloningError(
                "Reference codes are not available for this voice."
            )

        if not voice_profile.reference_text:
            raise VoiceCloningError(
                "Reference text is not available for this voice."
            )

        reference_codes = self._load_reference_codes(
            voice_profile.reference_codes_path
        )

        generation_id = uuid4()

        generation_start = time.perf_counter()

        wav = self.neutts_service.infer(
            input_text=input_text,
            reference_codes=reference_codes,
            reference_text=voice_profile.reference_text,
        )

        inference_time = time.perf_counter() - generation_start

        output_path = self.voice_storage.get_generation_path(
            user_id=user_id,
            generation_id=generation_id,
        )

        self.voice_storage.store_generation(
            user_id=user_id,
            generation_id=generation_id,
            audio=wav,
        )

        audio_duration = len(wav) / 24000
        rtf = inference_time / audio_duration if audio_duration > 0 else 0.0

        generation = await self.generation_repository.create(
            generation_id=generation_id,
            user_id=user_id,
            voice_id=voice_id,
            input_text=input_text,
            audio_path=str(output_path),
            model=voice_profile.model,
            generation_time=inference_time,
        )

        return {
            "generation": generation,
            "inference_time": inference_time,
            "audio_duration": audio_duration,
            "rtf": rtf,
        }

    @staticmethod
    def _load_reference_codes(reference_codes_path: str):
        import torch

        path = Path(reference_codes_path)

        if not path.exists():
            raise VoiceCloningError(
                "Reference codes file does not exist."
            )

        return torch.load(
            path,
            map_location="cpu",
            weights_only=False,
        )