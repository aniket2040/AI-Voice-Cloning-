from pathlib import Path
from uuid import uuid4, UUID

import soundfile as sf
import torch
from app.security.path import safe_path
from app.models import Generation


class VoiceStorageError(Exception):
    """Raised when voice storage operations fail."""


class VoiceStorageService:

    def __init__(self, base_dir: str | Path = "storage"):
        self.base_dir = Path(base_dir).resolve()

    def create_voice_id(self) -> str:
        """Generate a unique voice ID."""
        return f"voice_{uuid4().hex}"

    def get_voice_directory(
            self,
            user_id: str | UUID,
            voice_id: str | UUID,
    ) -> Path:
        """Return the directory for a registered voice."""

        return safe_path(
            self.base_dir,
            self.base_dir
            / "users"
            / str(user_id)
            / "voices"
            / str(voice_id),
        )

    def get_processed_voice_path(
        self,
        user_id: str,
        voice_id: str,
    ) -> Path:
        """Return the permanent processed voice path."""

        return self.get_voice_directory(
            user_id,
            voice_id,
        ) / "processed.wav"

    def create_voice_directory(
        self,
        user_id: str,
        voice_id: str,
    ) -> Path:
        """Create the voice-specific directory."""

        voice_dir = self.get_voice_directory(
            user_id,
            voice_id,
        )

        voice_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        return voice_dir

    def store_processed_voice(
        self,
        user_id: str,
        voice_id: str,
        processed_audio_path: str | Path,
    ) -> Path:
        """
        Copy the already processed voice into
        permanent voice storage.
        """

        source = Path(processed_audio_path)

        if not source.exists():
            raise VoiceStorageError(
                "Processed audio file does not exist."
            )

        if source.suffix.lower() != ".wav":
            raise VoiceStorageError(
                "Only processed WAV files can be stored."
            )

        voice_dir = self.create_voice_directory(
            user_id,
            voice_id,
        )

        destination = voice_dir / "processed.wav"

        destination.write_bytes(
            source.read_bytes()
        )

        return destination

    def get_reference_codes_path(
            self,
            user_id: str,
            voice_id: str,
    ) -> Path:
        """Return the permanent NeuTTS reference codes path."""

        return self.get_voice_directory(
            user_id,
            voice_id,
        ) / "reference_codes.pt"

    def store_reference_codes(
            self,
            user_id: str,
            voice_id: str,
            reference_codes,
    ) -> Path:
        """
        Store pre-encoded NeuTTS reference codes.
        """

        voice_dir = self.create_voice_directory(
            user_id,
            voice_id,
        )

        destination = voice_dir / "reference_codes.pt"



        torch.save(
            reference_codes,
            destination,
        )

        return destination


    def processed_voice_exists(
        self,
        user_id: str,
        voice_id: str,
    ) -> bool:
        """Check whether a processed voice exists."""

        path = self.get_processed_voice_path(
            user_id,
            voice_id,
        )

        return path.is_file()

    def delete_voice(
            self,
            user_id: str,
            voice_id: str,
    ) -> None:
        """
        Delete all stored files associated with a registered voice.
        """

        voice_dir = self.get_voice_directory(
            user_id,
            voice_id,
        )

        if not voice_dir.exists():
            return

        if not voice_dir.is_dir():
            raise VoiceStorageError(
                "Voice storage path is not a directory."
            )

        # Delete processed voice
        processed_file = voice_dir / "processed.wav"

        if processed_file.exists():
            processed_file.unlink()

        # Delete NeuTTS reference codes
        reference_codes_file = voice_dir / "reference_codes.pt"

        if reference_codes_file.exists():
            reference_codes_file.unlink()

        # Remove voice directory if empty
        if voice_dir.exists():
            voice_dir.rmdir()

    def get_generation_path(
            self,
            user_id: str | UUID,
            generation_id: str | UUID,
    ) -> Path:
        return safe_path(
            self.base_dir,
            self.base_dir
            / "users"
            / str(user_id)
            / "generations"
            / f"{generation_id}.wav",
        )

    def store_generation(
            self,
            user_id: str | UUID,
            generation_id: str | UUID,
            audio,
    ) -> Path:
        destination = self.get_generation_path(
            user_id,
            generation_id,
        )

        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        sf.write(
            destination,
            audio,
            24000,
            subtype="PCM_16",
        )

        return destination

    def delete_generation(
            self,
            user_id: str,
            generation_id,
    ) -> None:
        """
        Delete generated speech audio for a generation.
        """

        generation_path = self.get_generation_path(
            user_id,
            generation_id,
        )

        if generation_path.exists():
            generation_path.unlink()

    async def delete_by_voice(
            self,
            voice_id: UUID,
            user_id: UUID,
    ) -> list[Generation]:
        generations = await self.list_by_voice(
            voice_id=voice_id,
            user_id=user_id,
        )

        for generation in generations:
            await self.session.delete(generation)

        return generations


