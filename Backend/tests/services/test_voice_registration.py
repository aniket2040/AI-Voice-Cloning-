import pytest
import soundfile as sf

from pathlib import Path
from unittest.mock import Mock

from app.models.voice_profile import VoiceStatus
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.services.audio_processing import (
    AudioProcessingError,
    AudioProcessingService,
)
from app.services.voice_registration import (
    VoiceRegistrationError,
    VoiceRegistrationService,
)
from app.services.voice_storage import VoiceStorageService


@pytest.mark.asyncio
async def test_register_voice_success(
    tmp_path,
    db_session,
    create_test_user,
):
    # ---------------------------------------------------------
    # 1. Create test user in PostgreSQL
    # ---------------------------------------------------------

    user = await create_test_user()

    # ---------------------------------------------------------
    # 2. Create temporary uploaded audio
    # ---------------------------------------------------------

    input_path = tmp_path / "input.wav"

    sample_rate = 16_000
    audio = [0.1] * (sample_rate * 5)

    sf.write(
        input_path,
        audio,
        sample_rate,
    )

    processed_temp_path = (
        tmp_path / "processed_temp.wav"
    )

    # ---------------------------------------------------------
    # 3. Create services
    # ---------------------------------------------------------

    storage = VoiceStorageService(
        tmp_path / "storage"
    )

    repository = VoiceProfileRepository(
        db_session
    )

    processor = AudioProcessingService()

    neutts_service = Mock()

    neutts_service.encode_reference.return_value = {
        "fake": "reference_codes"
    }

    service = VoiceRegistrationService(
        audio_processor=processor,
        voice_storage=storage,
        profile_repository=repository,
        neutts_service=neutts_service,
    )

    # ---------------------------------------------------------
    # 4. Register voice
    # ---------------------------------------------------------

    profile = await service.register_voice(
        user_id=user.id,
        voice_name="My Voice",
        input_path=input_path,
        processed_temp_path=processed_temp_path,
        reference_text="Hello, this is my reference voice.",
    )

    # ---------------------------------------------------------
    # 5. Verify profile
    # ---------------------------------------------------------

    assert profile.id is not None
    assert profile.user_id == user.id
    assert profile.name == "My Voice"
    assert profile.status == VoiceStatus.READY
    assert profile.model == "neutts"

    assert profile.reference_text == (
        "Hello, this is my reference voice."
    )

    assert profile.reference_codes_path is not None

    # ---------------------------------------------------------
    # 6. Verify PostgreSQL record
    # ---------------------------------------------------------

    stored_profile = await repository.get_by_id(
        voice_id=profile.id,
        user_id=user.id,
    )

    assert stored_profile is not None
    assert stored_profile.id == profile.id
    assert stored_profile.name == "My Voice"
    assert stored_profile.status == VoiceStatus.READY

    assert stored_profile.reference_text == (
        "Hello, this is my reference voice."
    )

    assert stored_profile.reference_codes_path is not None

    # ---------------------------------------------------------
    # 7. Verify permanent processed audio
    # ---------------------------------------------------------

    assert storage.processed_voice_exists(
        str(user.id),
        str(profile.id),
    )

    assert Path(
        profile.reference_codes_path
    ).is_file()

    # ---------------------------------------------------------
    # 8. Verify NeuTTS reference encoding
    # ---------------------------------------------------------

    neutts_service.encode_reference.assert_called_once()

    # ---------------------------------------------------------
    # 9. Temporary files must be deleted
    # ---------------------------------------------------------

    assert not input_path.exists()
    assert not processed_temp_path.exists()


@pytest.mark.asyncio
async def test_registration_fails_when_processing_fails(
    tmp_path,
    db_session,
    create_test_user,
):
    # ---------------------------------------------------------
    # 1. Create test user
    # ---------------------------------------------------------

    user = await create_test_user()

    # ---------------------------------------------------------
    # 2. Create mocked NeuTTS service
    # ---------------------------------------------------------

    neutts_service = Mock()

    neutts_service.encode_reference.return_value = {
        "fake": "reference_codes"
    }

    # ---------------------------------------------------------
    # 3. Create temporary input
    # ---------------------------------------------------------

    input_path = tmp_path / "input.wav"

    input_path.write_bytes(
        b"temporary audio"
    )

    processed_temp_path = (
        tmp_path / "processed_temp.wav"
    )

    # ---------------------------------------------------------
    # 4. Create failing audio processor
    # ---------------------------------------------------------

    class FailingAudioProcessor:

        def process(
            self,
            input_path,
            output_path,
        ):
            raise AudioProcessingError(
                "Audio processing failed."
            )

    # ---------------------------------------------------------
    # 5. Create services
    # ---------------------------------------------------------

    storage = VoiceStorageService(
        tmp_path / "storage"
    )

    repository = VoiceProfileRepository(
        db_session
    )

    service = VoiceRegistrationService(
        audio_processor=FailingAudioProcessor(),
        voice_storage=storage,
        profile_repository=repository,
        neutts_service=neutts_service,
    )

    # ---------------------------------------------------------
    # 6. Registration must fail
    # ---------------------------------------------------------

    with pytest.raises(
        VoiceRegistrationError
    ):
        await service.register_voice(
            user_id=user.id,
            voice_name="Failed Voice",
            input_path=input_path,
            processed_temp_path=processed_temp_path,
            reference_text=(
                "Hello, this is my reference voice."
            ),
        )

    # ---------------------------------------------------------
    # 7. Database profile should be FAILED
    # ---------------------------------------------------------

    profiles = await repository.list_by_user(
        user.id
    )

    assert len(profiles) == 1

    assert profiles[0].status == VoiceStatus.FAILED

    # ---------------------------------------------------------
    # 8. NeuTTS should NOT be called
    # ---------------------------------------------------------

    neutts_service.encode_reference.assert_not_called()

    # ---------------------------------------------------------
    # 9. Temporary files must be deleted
    # ---------------------------------------------------------

    assert not input_path.exists()
    assert not processed_temp_path.exists()


@pytest.mark.asyncio
async def test_registration_fails_when_storage_fails(
    tmp_path,
    db_session,
    create_test_user,
):
    # ---------------------------------------------------------
    # 1. Create test user
    # ---------------------------------------------------------

    user = await create_test_user()

    # ---------------------------------------------------------
    # 2. Create mocked NeuTTS service
    # ---------------------------------------------------------

    neutts_service = Mock()

    neutts_service.encode_reference.return_value = {
        "fake": "reference_codes"
    }

    # ---------------------------------------------------------
    # 3. Create temporary input
    # ---------------------------------------------------------

    input_path = tmp_path / "input.wav"

    input_path.write_bytes(
        b"temporary audio"
    )

    processed_temp_path = (
        tmp_path / "processed_temp.wav"
    )

    # ---------------------------------------------------------
    # 4. Create fake audio processor
    # ---------------------------------------------------------

    class FakeAudioProcessor:

        def process(
            self,
            input_path,
            output_path,
        ):
            output_path.write_bytes(
                b"processed audio"
            )

    # ---------------------------------------------------------
    # 5. Create failing storage
    # ---------------------------------------------------------

    class FailingVoiceStorage:

        def store_processed_voice(
            self,
            user_id,
            voice_id,
            processed_audio_path,
        ):
            raise RuntimeError(
                "Storage failed"
            )

    # ---------------------------------------------------------
    # 6. Create services
    # ---------------------------------------------------------

    repository = VoiceProfileRepository(
        db_session
    )

    service = VoiceRegistrationService(
        audio_processor=FakeAudioProcessor(),
        voice_storage=FailingVoiceStorage(),
        profile_repository=repository,
        neutts_service=neutts_service,
    )

    # ---------------------------------------------------------
    # 7. Registration must fail
    # ---------------------------------------------------------

    with pytest.raises(
        VoiceRegistrationError
    ):
        await service.register_voice(
            user_id=user.id,
            voice_name="Storage Failure Voice",
            input_path=input_path,
            processed_temp_path=processed_temp_path,
            reference_text=(
                "Hello, this is my reference voice."
            ),
        )

    # ---------------------------------------------------------
    # 8. Database profile should be FAILED
    # ---------------------------------------------------------

    profiles = await repository.list_by_user(
        user.id
    )

    assert len(profiles) == 1

    assert profiles[0].status == VoiceStatus.FAILED

    # ---------------------------------------------------------
    # 9. NeuTTS should NOT be called
    # ---------------------------------------------------------

    neutts_service.encode_reference.assert_not_called()

    # ---------------------------------------------------------
    # 10. Temporary files must be deleted
    # ---------------------------------------------------------

    assert not input_path.exists()
    assert not processed_temp_path.exists()