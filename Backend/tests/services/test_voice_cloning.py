from pathlib import Path
from uuid import uuid4, UUID
from unittest.mock import AsyncMock, Mock, patch
import pytest
import numpy as np

from app.models.voice_profile import VoiceStatus
from app.services.voice_cloning_service import VoiceCloningService, VoiceCloningError


async def test_generate_speech_success(tmp_path):
    user_id = uuid4()
    voice_id = uuid4()
    generation_id = uuid4()

    reference_codes_path = tmp_path / "reference_codes.pt"

    import torch

    torch.save(
        {"fake": "codes"},
        reference_codes_path,
    )

    voice_profile = Mock()
    voice_profile.id = voice_id
    voice_profile.user_id = user_id
    voice_profile.status = VoiceStatus.READY
    voice_profile.reference_codes_path = str(reference_codes_path)
    voice_profile.reference_text = "This is the reference speaker."
    voice_profile.model = "neutts"

    voice_profile_repository = Mock()
    voice_profile_repository.get_by_id = AsyncMock(
        return_value=voice_profile
    )

    generation = Mock()
    generation.id = generation_id

    generation_repository = Mock()
    generation_repository.create = AsyncMock(
        return_value=generation
    )

    neutts_service = Mock()

    fake_audio = np.zeros(
        24000,
        dtype=np.float32,
    )

    neutts_service.infer.return_value = fake_audio

    voice_storage = Mock()

    output_path = tmp_path / "generation.wav"

    voice_storage.get_generation_path.return_value = output_path
    voice_storage.store_generation.return_value = output_path

    service = VoiceCloningService(
        voice_profile_repository=voice_profile_repository,
        generation_repository=generation_repository,
        voice_storage=voice_storage,
        neutts_service=neutts_service,
    )

    result = await service.generate_speech(
        user_id=user_id,
        voice_id=voice_id,
        input_text="Hello, this is a generated sentence.",
    )

    voice_profile_repository.get_by_id.assert_awaited_once_with(
        voice_id=voice_id,
        user_id=user_id,
    )

    neutts_service.infer.assert_called_once_with(
        input_text="Hello, this is a generated sentence.",
        reference_codes={"fake": "codes"},
        reference_text="This is the reference speaker.",
    )

    voice_storage.store_generation.assert_called_once()

    generation_repository.create.assert_awaited_once()

    assert result["generation"] is generation
    assert result["audio_duration"] == 1.0

async def test_generate_speech_rejects_empty_text():
    service = VoiceCloningService(
        voice_profile_repository=Mock(),
        generation_repository=Mock(),
        voice_storage=Mock(),
        neutts_service=Mock(),
    )

    try:
        await service.generate_speech(
            user_id=uuid4(),
            voice_id=uuid4(),
            input_text="   ",
        )
        assert False, "Expected VoiceCloningError"
    except VoiceCloningError as exc:
        assert str(exc) == "Input text cannot be empty."

async def test_generate_speech_rejects_unknown_voice():
    voice_profile_repository = Mock()
    voice_profile_repository.get_by_id = AsyncMock(
        return_value=None
    )

    service = VoiceCloningService(
        voice_profile_repository=voice_profile_repository,
        generation_repository=Mock(),
        voice_storage=Mock(),
        neutts_service=Mock(),
    )

    try:
        await service.generate_speech(
            user_id=uuid4(),
            voice_id=uuid4(),
            input_text="Hello",
        )
        assert False, "Expected VoiceCloningError"
    except VoiceCloningError as exc:
        assert str(exc) == "Voice profile not found."

async def test_generate_speech_rejects_non_ready_voice():
    voice_profile = Mock()
    voice_profile.status = VoiceStatus.PROCESSING

    voice_profile_repository = Mock()
    voice_profile_repository.get_by_id = AsyncMock(
        return_value=voice_profile
    )

    service = VoiceCloningService(
        voice_profile_repository=voice_profile_repository,
        generation_repository=Mock(),
        voice_storage=Mock(),
        neutts_service=Mock(),
    )

    try:
        await service.generate_speech(
            user_id=uuid4(),
            voice_id=uuid4(),
            input_text="Hello",
        )
        assert False, "Expected VoiceCloningError"
    except VoiceCloningError as exc:
        assert str(exc) == "Voice profile is not ready for generation."



@pytest.mark.asyncio
async def test_generate_speech_rejects_long_text():
    service = VoiceCloningService(
        voice_profile_repository=Mock(),
        generation_repository=Mock(),
        voice_storage=Mock(),
        neutts_service=Mock(),
    )

    long_text = "a" * 5001

    with pytest.raises(VoiceCloningError) as exc:
        await service.generate_speech(
            user_id=uuid4(),
            voice_id=uuid4(),
            input_text=long_text,
        )

    assert str(exc.value) == (
        "Input text is too long. Maximum length is 5000 characters."
    )
