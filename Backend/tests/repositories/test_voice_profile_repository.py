from uuid import uuid4

import pytest

from app.models.voice_profile import VoiceStatus
from app.repositories.voice_profile_repository import VoiceProfileRepository


@pytest.mark.asyncio
async def test_create_voice_profile(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(name="Test User")

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/users/test/voices/voice.wav",
    )

    assert voice.id is not None
    assert voice.user_id == user.id
    assert voice.name == "My Voice"
    assert voice.processed_audio_path.endswith("voice.wav")
    assert voice.status == VoiceStatus.UPLOADED
    assert voice.model == "neutts"


@pytest.mark.asyncio
async def test_get_voice_by_id(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(name="Test User")

    created_voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/voice.wav",
    )

    voice = await voice_repository.get_by_id(
        voice_id=created_voice.id,
        user_id=user.id,
    )

    assert voice is not None
    assert voice.id == created_voice.id
    assert voice.name == "My Voice"


@pytest.mark.asyncio
async def test_get_nonexistent_voice(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(name="Test User")

    voice = await voice_repository.get_by_id(
        voice_id=uuid4(),
        user_id=user.id,
    )

    assert voice is None


@pytest.mark.asyncio
async def test_list_voices_by_user(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(name="Test User")

    await voice_repository.create(
        user_id=user.id,
        name="Voice One",
        processed_audio_path="storage/voice1.wav",
    )

    await voice_repository.create(
        user_id=user.id,
        name="Voice Two",
        processed_audio_path="storage/voice2.wav",
    )

    voices = await voice_repository.list_by_user(user.id)

    assert len(voices) == 2
    assert voices[0].name == "Voice One"
    assert voices[1].name == "Voice Two"


@pytest.mark.asyncio
async def test_list_ready_voices(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(name="Test User")

    voice1 = await voice_repository.create(
        user_id=user.id,
        name="Ready Voice",
        processed_audio_path="storage/ready.wav",
        status=VoiceStatus.READY,
    )

    await voice_repository.create(
        user_id=user.id,
        name="Processing Voice",
        processed_audio_path="storage/processing.wav",
        status=VoiceStatus.PROCESSING,
    )

    voices = await voice_repository.list_ready_by_user(user.id)

    assert len(voices) == 1
    assert voices[0].id == voice1.id
    assert voices[0].status == VoiceStatus.READY


@pytest.mark.asyncio
async def test_update_voice_status(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(name="Test User")

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/voice.wav",
    )

    updated_voice = await voice_repository.update_status(
        voice_id=voice.id,
        user_id=user.id,
        status=VoiceStatus.READY,
    )

    assert updated_voice is not None
    assert updated_voice.status == VoiceStatus.READY


@pytest.mark.asyncio
async def test_delete_voice(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(name="Test User")

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/voice.wav",
    )

    deleted = await voice_repository.delete(
        voice_id=voice.id,
        user_id=user.id,
    )

    assert deleted is True

    result = await voice_repository.get_by_id(
        voice_id=voice.id,
        user_id=user.id,
    )

    assert result is None


@pytest.mark.asyncio
async def test_user_cannot_access_another_users_voice(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)

    user1 = await create_test_user(name="User One")
    user2 = await create_test_user(name="User Two")

    voice = await voice_repository.create(
        user_id=user1.id,
        name="User One Voice",
        processed_audio_path="storage/voice.wav",
    )

    result = await voice_repository.get_by_id(
        voice_id=voice.id,
        user_id=user2.id,
    )

    assert result is None