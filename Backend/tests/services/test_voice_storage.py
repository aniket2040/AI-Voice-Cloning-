from pathlib import Path

from app.services.voice_storage import VoiceStorageService


def test_creates_voice_directory(tmp_path):
    service = VoiceStorageService(tmp_path)

    voice_id = service.create_voice_id()

    voice_dir = service.create_voice_directory(
        user_id="user_123",
        voice_id=voice_id,
    )

    assert voice_dir.exists()
    assert voice_dir.is_dir()

def test_generates_unique_voice_ids(tmp_path):
    service = VoiceStorageService(tmp_path)

    voice_id_1 = service.create_voice_id()
    voice_id_2 = service.create_voice_id()

    assert voice_id_1 != voice_id_2
    assert voice_id_1.startswith("voice_")
    assert voice_id_2.startswith("voice_")

def test_stores_processed_voice(tmp_path):
    service = VoiceStorageService(tmp_path)

    source = tmp_path / "processed_source.wav"
    source.write_bytes(b"fake wav data")

    voice_id = service.create_voice_id()

    destination = service.store_processed_voice(
        user_id="user_123",
        voice_id=voice_id,
        processed_audio_path=source,
    )

    assert destination.exists()
    assert destination.name == "processed.wav"
    assert destination.read_bytes() == b"fake wav data"

def test_isolates_users(tmp_path):
    service = VoiceStorageService(tmp_path)

    source = tmp_path / "processed.wav"
    source.write_bytes(b"fake wav data")

    voice_id_1 = service.create_voice_id()
    voice_id_2 = service.create_voice_id()

    path_1 = service.store_processed_voice(
        user_id="user_1",
        voice_id=voice_id_1,
        processed_audio_path=source,
    )

    path_2 = service.store_processed_voice(
        user_id="user_2",
        voice_id=voice_id_2,
        processed_audio_path=source,
    )

    assert path_1 != path_2
    assert "user_1" in str(path_1)
    assert "user_2" in str(path_2)

import pytest

from app.services.voice_storage import VoiceStorageError


def test_rejects_non_wav_processed_audio(tmp_path):
    service = VoiceStorageService(tmp_path)

    source = tmp_path / "voice.mp3"
    source.write_bytes(b"fake mp3 data")

    voice_id = service.create_voice_id()

    with pytest.raises(VoiceStorageError):
        service.store_processed_voice(
            user_id="user_123",
            voice_id=voice_id,
            processed_audio_path=source,
        )

