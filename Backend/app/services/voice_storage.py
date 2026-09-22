from pathlib import Path
from uuid import uuid4

import soundfile as sf
import torch

class VoiceStorageError(Exception):
    """Raised when voice storage operations fail."""


class VoiceStorageService:

    def __init__(self, base_dir: str | Path = "storage"):
        self.base_dir = Path(base_dir)

    def create_voice_id(self) -> str:
        """Generate a unique voice ID."""
        return f"voice_{uuid4().hex}"

    def get_voice_directory(
        self,
        user_id: str,
        voice_id: str,
    ) -> Path:
        """Return the directory for a registered voice."""

        return (
            self.base_dir
            / "users"
            / user_id
            / "voices"
            / voice_id
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
        """Delete a registered voice and its processed audio."""

        voice_dir = self.get_voice_directory(
            user_id,
            voice_id,
        )

        if not voice_dir.exists():
            return

        processed_file = voice_dir / "processed.wav"

        if processed_file.exists():
            processed_file.unlink()

        voice_dir.rmdir()

    def get_generation_path(
            self,
            user_id: str,
            generation_id,
    ) -> Path:
        return (
                self.base_dir
                / "users"
                / str(user_id)
                / "generations"
                / f"{generation_id}.wav"
        )

    def store_generation(
            self,
            user_id: str,
            generation_id,
            audio,
    ) -> Path:
        generation_dir = (
                self.base_dir
                / "users"
                / str(user_id)
                / "generations"
        )

        generation_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        destination = generation_dir / f"{generation_id}.wav"

        sf.write(
            destination,
            audio,
            24000,
            subtype="PCM_16",
        )

        return destination