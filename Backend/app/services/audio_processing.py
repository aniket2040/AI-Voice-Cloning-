from dataclasses import dataclass
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf


TARGET_SAMPLE_RATE = 16_000

MIN_DURATION_SECONDS = 3.0
MAX_DURATION_SECONDS = 15.0

SILENCE_TOP_DB = 30


@dataclass
class ProcessedAudio:
    output_path: Path
    duration_seconds: float
    sample_rate: int
    channels: int
    original_sample_rate: int


class AudioProcessingError(Exception):
    """Raised when audio processing fails."""


class AudioProcessingService:

    def process(
        self,
        input_path: Path,
        output_path: Path,
    ) -> ProcessedAudio:

        try:
            audio, original_sample_rate = self._load_audio(
                input_path
            )

            audio = self._convert_to_mono(audio)

            audio = self._resample(
                audio,
                original_sample_rate,
            )

            audio = self._trim_silence(audio)

            duration = self._get_duration(audio)

            self._validate_duration(duration)

            self._validate_audio_quality(audio)

            audio = self._normalize(audio)

            self._save_audio(
                audio,
                output_path,
            )

            return ProcessedAudio(
                output_path=output_path,
                duration_seconds=duration,
                sample_rate=TARGET_SAMPLE_RATE,
                channels=1,
                original_sample_rate=original_sample_rate,
            )

        except AudioProcessingError:
            raise

        except Exception as exc:
            raise AudioProcessingError(
                f"Audio processing failed: {exc}"
            ) from exc

    def _load_audio(
        self,
        input_path: Path,
    ) -> tuple[np.ndarray, int]:

        if not input_path.exists():
            raise AudioProcessingError(
                "Input audio file does not exist."
            )

        try:
            audio, sample_rate = librosa.load(
                input_path,
                sr=None,
                mono=False,
            )

        except Exception as exc:
            raise AudioProcessingError(
                "Unable to load audio file."
            ) from exc

        if audio.size == 0:
            raise AudioProcessingError(
                "Audio file is empty."
            )

        return audio, sample_rate

    def _convert_to_mono(
        self,
        audio: np.ndarray,
    ) -> np.ndarray:

        if audio.ndim == 1:
            return audio

        if audio.ndim == 2:
            return np.mean(audio, axis=0)

        raise AudioProcessingError(
            "Unsupported audio channel structure."
        )

    def _resample(
        self,
        audio: np.ndarray,
        original_sample_rate: int,
    ) -> np.ndarray:

        if original_sample_rate == TARGET_SAMPLE_RATE:
            return audio

        try:
            return librosa.resample(
                audio,
                orig_sr=original_sample_rate,
                target_sr=TARGET_SAMPLE_RATE,
            )

        except Exception as exc:
            raise AudioProcessingError(
                "Audio resampling failed."
            ) from exc

    def _trim_silence(
        self,
        audio: np.ndarray,
    ) -> np.ndarray:

        if np.max(np.abs(audio)) == 0:
            raise AudioProcessingError(
                "Audio contains only silence."
            )

        trimmed_audio, _ = librosa.effects.trim(
            audio,
            top_db=SILENCE_TOP_DB,
        )

        if trimmed_audio.size == 0:
            raise AudioProcessingError(
                "No usable speech detected."
            )

        return trimmed_audio

    def _get_duration(
        self,
        audio: np.ndarray,
    ) -> float:

        return len(audio) / TARGET_SAMPLE_RATE

    def _validate_duration(
        self,
        duration: float,
    ) -> None:

        if duration < MIN_DURATION_SECONDS:
            raise AudioProcessingError(
                f"Usable speech must be at least "
                f"{MIN_DURATION_SECONDS:g} seconds."
            )

        if duration > MAX_DURATION_SECONDS:
            raise AudioProcessingError(
                f"Usable speech must not exceed "
                f"{MAX_DURATION_SECONDS:g} seconds."
            )

    def _validate_audio_quality(
        self,
        audio: np.ndarray,
    ) -> None:

        if not np.all(np.isfinite(audio)):
            raise AudioProcessingError(
                "Audio contains invalid numerical values."
            )

        peak = np.max(np.abs(audio))

        if peak <= 0:
            raise AudioProcessingError(
                "Audio signal is silent."
            )

        rms = np.sqrt(np.mean(np.square(audio)))

        if rms < 1e-4:
            raise AudioProcessingError(
                "Audio signal is too quiet."
            )

    def _normalize(
        self,
        audio: np.ndarray,
    ) -> np.ndarray:

        peak = np.max(np.abs(audio))

        if peak <= 0:
            raise AudioProcessingError(
                "Cannot normalize silent audio."
            )

        target_peak = 0.95

        normalized = audio / peak

        return normalized * target_peak

    def _save_audio(
        self,
        audio: np.ndarray,
        output_path: Path,
    ) -> None:

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            sf.write(
                output_path,
                audio,
                TARGET_SAMPLE_RATE,
                subtype="PCM_16",
                format="WAV",
            )

        except Exception as exc:
            raise AudioProcessingError(
                "Unable to save processed audio."
            ) from exc