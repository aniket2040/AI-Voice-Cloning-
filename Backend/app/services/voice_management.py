from uuid import UUID

from app.repositories.generation_repository import GenerationRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.services.voice_storage import VoiceStorageService


class VoiceManagementError(Exception):
    """Raised when voice management operations fail."""


class VoiceManagementService:

    def __init__(
        self,
        voice_profile_repository: VoiceProfileRepository,
        generation_repository: GenerationRepository,
        voice_storage: VoiceStorageService,
    ):
        self.voice_profile_repository = voice_profile_repository
        self.generation_repository = generation_repository
        self.voice_storage = voice_storage

    async def delete_voice(
        self,
        user_id: UUID,
        voice_id: UUID,
    ) -> bool:

        # -----------------------------------------------------
        # 1. Verify voice ownership
        # -----------------------------------------------------

        voice = await self.voice_profile_repository.get_by_id(
            voice_id=voice_id,
            user_id=user_id,
        )

        if voice is None:
            return False

        # -----------------------------------------------------
        # 2. Find all generations belonging to this voice
        # -----------------------------------------------------

        generations = await self.generation_repository.list_by_voice(
            voice_id=voice_id,
            user_id=user_id,
        )

        # -----------------------------------------------------
        # 3. Delete generated audio files
        # -----------------------------------------------------

        for generation in generations:
            self.voice_storage.delete_generation(
                user_id=user_id,
                generation_id=generation.id,
            )

        # -----------------------------------------------------
        # 4. Delete generation database records
        # -----------------------------------------------------

        for generation in generations:
            await self.generation_repository.delete(
                generation_id=generation.id,
                user_id=user_id,
            )

        # -----------------------------------------------------
        # 5. Delete voice storage
        # -----------------------------------------------------

        self.voice_storage.delete_voice(
            user_id=user_id,
            voice_id=voice_id,
        )

        # -----------------------------------------------------
        # 6. Delete voice profile
        # -----------------------------------------------------

        deleted = await self.voice_profile_repository.delete(
            voice_id=voice_id,
            user_id=user_id,
        )

        return deleted