from pathlib import Path

import numpy as np
import pytest
import soundfile as sf
import subprocess
from app.services.audio_processing import (
    AudioProcessingService,
    MAX_DURATION_SECONDS,
    MIN_DURATION_SECONDS,
    TARGET_SAMPLE_RATE, AudioProcessingError,
)


def test_process_audio(tmp_path: Path):

    input_path = tmp_path / "input.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 44_100

    duration = 5

    t = np.linspace(
        0,
        duration,
        int(sample_rate * duration),
        endpoint=False,
    )

    audio = 0.2 * np.sin(
        2 * np.pi * 440 * t
    )

    sf.write(
        input_path,
        audio,
        sample_rate,
    )

    service = AudioProcessingService()

    result = service.process(
        input_path,
        output_path,
    )

    assert output_path.exists()

    assert result.sample_rate == TARGET_SAMPLE_RATE

    assert result.channels == 1

    assert (
        MIN_DURATION_SECONDS
        <= result.duration_seconds
        <= MAX_DURATION_SECONDS
    )


def test_converts_stereo_to_mono(tmp_path):
    input_path = tmp_path / "stereo.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000
    duration = 5

    # Create stereo audio
    audio = np.random.uniform(
        -0.5,
        0.5,
        (sample_rate * duration, 2)
    ).astype(np.float32)

    sf.write(input_path, audio, sample_rate)

    service = AudioProcessingService()

    result = service.process(
        input_path=input_path,
        output_path=output_path,
    )

    processed_audio, processed_sr = sf.read(output_path)

    assert processed_sr == 16_000
    assert processed_audio.ndim == 1
    assert result.channels == 1


def test_resamples_to_16khz(tmp_path):
    input_path = tmp_path / "input.wav"
    output_path = tmp_path / "processed.wav"

    original_sample_rate = 44_100
    duration = 5

    audio = np.random.uniform(
        -0.5,
        0.5,
        original_sample_rate * duration
    ).astype(np.float32)

    sf.write(input_path, audio, original_sample_rate)

    service = AudioProcessingService()

    result = service.process(
        input_path=input_path,
        output_path=output_path,
    )

    processed_audio, processed_sr = sf.read(output_path)

    assert processed_sr == 16_000
    assert result.sample_rate == 16_000
    assert result.channels == 1


def test_trims_leading_and_trailing_silence(tmp_path):
    input_path = tmp_path / "input.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000

    # 1 second silence
    silence = np.zeros(sample_rate, dtype=np.float32)

    # 5 seconds of usable audio
    speech = np.random.uniform(
        -0.3,
        0.3,
        sample_rate * 5
    ).astype(np.float32)

    audio = np.concatenate([
        silence,
        speech,
        silence,
    ])

    sf.write(input_path, audio, sample_rate)

    service = AudioProcessingService()

    result = service.process(
        input_path=input_path,
        output_path=output_path,
    )

    processed_audio, processed_sr = sf.read(output_path)

    assert processed_sr == 16_000

    # Original = 7 seconds.
    # After trimming, it should be approximately 5 seconds.
    assert 4.5 <= len(processed_audio) / processed_sr <= 5.5


def test_rejects_audio_under_3_seconds(tmp_path):
    input_path = tmp_path / "short.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000
    duration = 2

    audio = np.random.uniform(
        -0.3,
        0.3,
        sample_rate * duration
    ).astype(np.float32)

    sf.write(input_path, audio, sample_rate)

    service = AudioProcessingService()

    with pytest.raises(AudioProcessingError):
        service.process(
            input_path=input_path,
            output_path=output_path,
        )

def test_rejects_audio_over_15_seconds(tmp_path):
    input_path = tmp_path / "long.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000
    duration = 16

    audio = np.random.uniform(
        -0.3,
        0.3,
        sample_rate * duration
    ).astype(np.float32)

    sf.write(input_path, audio, sample_rate)

    service = AudioProcessingService()

    with pytest.raises(AudioProcessingError):
        service.process(
            input_path=input_path,
            output_path=output_path,
        )

def test_rejects_silent_audio(tmp_path):
    input_path = tmp_path / "silent.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000
    duration = 5

    audio = np.zeros(
        sample_rate * duration,
        dtype=np.float32,
    )

    sf.write(input_path, audio, sample_rate)

    service = AudioProcessingService()

    with pytest.raises(AudioProcessingError):
        service.process(
            input_path=input_path,
            output_path=output_path,
        )


def test_normalizes_audio_peak(tmp_path):
    input_path = tmp_path / "loud.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000
    duration = 5

    # Create audio with a peak above our target normalization level.
    audio = np.full(
        sample_rate * duration,
        0.99,
        dtype=np.float32,
    )

    sf.write(input_path, audio, sample_rate)

    service = AudioProcessingService()

    service.process(
        input_path=input_path,
        output_path=output_path,
    )

    processed_audio, _ = sf.read(output_path)

    peak = np.max(np.abs(processed_audio))

    # Our target peak is approximately 0.95.
    assert peak <= 0.95 + 0.01
    assert peak > 0.80

def test_outputs_pcm16_wav(tmp_path):
    input_path = tmp_path / "input.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000
    duration = 5

    audio = np.random.uniform(
        -0.3,
        0.3,
        sample_rate * duration
    ).astype(np.float32)

    sf.write(input_path, audio, sample_rate)

    service = AudioProcessingService()

    service.process(
        input_path=input_path,
        output_path=output_path,
    )

    info = sf.info(output_path)

    assert info.format == "WAV"
    assert info.subtype == "PCM_16"
    assert info.samplerate == 16_000
    assert info.channels == 1


def test_processes_mp3_input(tmp_path):
    input_path = tmp_path / "input.mp3"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16_000
    duration = 5

    audio = np.random.uniform(
        -0.3,
        0.3,
        sample_rate * duration
    ).astype(np.float32)

    # Create a temporary WAV first.
    temp_wav = tmp_path / "source.wav"
    sf.write(temp_wav, audio, sample_rate)

    # Convert WAV → MP3 using FFmpeg.
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(temp_wav),
            str(input_path),
        ],
        check=True,
        capture_output=True,
    )

    service = AudioProcessingService()

    service.process(
        input_path=input_path,
        output_path=output_path,
    )

    info = sf.info(output_path)

    assert info.format == "WAV"
    assert info.subtype == "PCM_16"
    assert info.samplerate == 16_000
    assert info.channels == 1


def test_process_stereo_audio_converts_to_mono(tmp_path):
    input_path = tmp_path / "stereo.wav"
    output_path = tmp_path / "processed.wav"

    sample_rate = 16000
    duration = 5

    audio = np.full(
        (sample_rate * duration, 2),
        0.1,
        dtype=np.float32,
    )

    sf.write(
        input_path,
        audio,
        sample_rate,
        subtype="PCM_16",
    )

    service = AudioProcessingService()

    result = service.process(
        input_path=input_path,
        output_path=output_path,
    )

    processed_audio, processed_sample_rate = sf.read(
        output_path
    )

    assert result.channels == 1
    assert processed_sample_rate == 16000

    if processed_audio.ndim == 1:
        channels = 1
    else:
        channels = processed_audio.shape[1]

    assert channels == 1


def test_process_audio_resamples_to_target_sample_rate(tmp_path):
    input_path = tmp_path / "44100.wav"
    output_path = tmp_path / "processed.wav"

    original_sample_rate = 44100
    duration = 5

    audio = np.full(
        original_sample_rate * duration,
        0.1,
        dtype=np.float32,
    )

    sf.write(
        input_path,
        audio,
        original_sample_rate,
        subtype="PCM_16",
    )

    service = AudioProcessingService()

    result = service.process(
        input_path=input_path,
        output_path=output_path,
    )

    processed_audio, processed_sample_rate = sf.read(
        output_path
    )

    assert result.original_sample_rate == 44100
    assert result.sample_rate == 16000
    assert processed_sample_rate == 16000
    assert processed_audio.ndim == 1