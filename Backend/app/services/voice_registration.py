from datetime import datetime
from pathlib import Path
from uuid import UUID

from app.models.voice_profile import VoiceProfile, VoiceStatus
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.services.audio_processing import AudioProcessingService
from app.services.voice_storage import VoiceStorageService
from app.services.neutts_service import NeuTTSService
class VoiceRegistrationError(Exception):
    pass


class VoiceRegistrationService:

    def __init__(
            self,
            audio_processor: AudioProcessingService,
            voice_storage: VoiceStorageService,
            profile_repository: VoiceProfileRepository,
            neutts_service: NeuTTSService,
    ):
        self.audio_processor = audio_processor
        self.voice_storage = voice_storage
        self.profile_repository = profile_repository
        self.neutts_service = neutts_service

    async def register_voice(
            self,
            user_id: UUID,
            voice_name: str,
            input_path: str | Path,
            processed_temp_path: str | Path,
            reference_text: str,
            model: str = "neutts",
    ) -> VoiceProfile:

        input_path = Path(input_path)
        processed_temp_path = Path(processed_temp_path)

        reference_text = reference_text.strip()

        if not reference_text:
            raise VoiceRegistrationError(
                "Reference text cannot be empty."
            )

        if not input_path.exists():
            raise VoiceRegistrationError(
                "Input voice file does not exist."
            )

        voice = None

        try:
            # --------------------------------------------------
            # 1. Create initial database record
            # --------------------------------------------------

            voice = await self.profile_repository.create(
                user_id=user_id,
                name=voice_name,
                processed_audio_path="",
                status=VoiceStatus.UPLOADED,
                model=model,
            )

            # --------------------------------------------------
            # 2. Mark as PROCESSING
            # --------------------------------------------------

            voice = await self.profile_repository.update_status(
                voice_id=voice.id,
                user_id=user_id,
                status=VoiceStatus.PROCESSING,
            )

            if voice is None:
                raise VoiceRegistrationError(
                    "Voice profile could not be updated."
                )

            # --------------------------------------------------
            # 3. Process audio
            # --------------------------------------------------

            self.audio_processor.process(
                input_path=input_path,
                output_path=processed_temp_path,
            )

            # --------------------------------------------------
            # 4. Store processed voice permanently
            # --------------------------------------------------

            stored_path = self.voice_storage.store_processed_voice(
                user_id=str(user_id),
                voice_id=str(voice.id),
                processed_audio_path=processed_temp_path,
            )

            # --------------------------------------------------
            # 5. Update database with permanent path
            # --------------------------------------------------

            voice = await self.profile_repository.update_audio_path(
                voice_id=voice.id,
                user_id=user_id,
                processed_audio_path=str(stored_path),
            )

            if voice is None:
                raise VoiceRegistrationError(
                    "Voice profile could not be updated with audio path."
                )

            # --------------------------------------------------
            # 6. Encode NeuTTS reference
            # --------------------------------------------------

            reference_codes = self.neutts_service.encode_reference(
                stored_path
            )
            # --------------------------------------------------
            # 7. Store reference codes
            # --------------------------------------------------

            reference_codes_path = (
                self.voice_storage.store_reference_codes(
                    user_id=str(user_id),
                    voice_id=str(voice.id),
                    reference_codes=reference_codes,
                )
            )

            # --------------------------------------------------
            # 8. Save NeuTTS reference data
            # --------------------------------------------------

            voice = await self.profile_repository.update_reference_data(
                voice_id=voice.id,
                user_id=user_id,
                reference_codes_path=str(reference_codes_path),
                reference_text=reference_text,
            )

            if voice is None:
                raise VoiceRegistrationError(
                    "Voice profile could not be updated with reference data."
                )

            # --------------------------------------------------
            # 9. Mark voice READY
            # --------------------------------------------------

            voice = await self.profile_repository.update_status(
                voice_id=voice.id,
                user_id=user_id,
                status=VoiceStatus.READY,
            )

            # --------------------------------------------------
            # 6. Mark voice READY
            # --------------------------------------------------

            voice = await self.profile_repository.update_status(
                voice_id=voice.id,
                user_id=user_id,
                status=VoiceStatus.READY,
            )

            if voice is None:
                raise VoiceRegistrationError(
                    "Voice profile could not be marked as READY."
                )

            return voice

        except Exception as exc:

            # --------------------------------------------------
            # Failure handling
            # --------------------------------------------------

            if voice is not None:
                try:
                    await self.profile_repository.update_status(
                        voice_id=voice.id,
                        user_id=user_id,
                        status=VoiceStatus.FAILED,
                    )
                except Exception:
                    pass

            if isinstance(exc, VoiceRegistrationError):
                raise

            raise VoiceRegistrationError(
                f"Voice registration failed: {exc}"
            ) from exc

        finally:

            # --------------------------------------------------
            # Temporary files must never remain
            # --------------------------------------------------

            if input_path.exists():
                input_path.unlink()

            if processed_temp_path.exists():
                processed_temp_path.unlink()