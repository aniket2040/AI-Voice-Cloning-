from uuid import uuid4

import pytest

from app.models.voice_profile import VoiceStatus
from app.repositories.generation_repository import GenerationRepository
from app.repositories.user_repository import UserRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository


@pytest.mark.asyncio
async def test_database_relationships_and_ownership(db_session):
    # ---------------------------------------------------------
    # 1. Create users
    # ---------------------------------------------------------

    user_repository = UserRepository(db_session)

    user_1 = await user_repository.create("User One")
    user_2 = await user_repository.create("User Two")

    assert user_1.id != user_2.id

    # ---------------------------------------------------------
    # 2. Create voice profiles
    # ---------------------------------------------------------

    voice_repository = VoiceProfileRepository(db_session)

    voice_1 = await voice_repository.create(
        user_id=user_1.id,
        name="User One Voice",
        processed_audio_path="storage/users/user1/voice1/processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    voice_2 = await voice_repository.create(
        user_id=user_2.id,
        name="User Two Voice",
        processed_audio_path="storage/users/user2/voice1/processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    assert voice_1.user_id == user_1.id
    assert voice_2.user_id == user_2.id

    # ---------------------------------------------------------
    # 3. Verify user isolation
    # ---------------------------------------------------------

    result = await voice_repository.get_by_id(
        voice_id=voice_1.id,
        user_id=user_2.id,
    )

    assert result is None

    result = await voice_repository.get_by_id(
        voice_id=voice_1.id,
        user_id=user_1.id,
    )

    assert result is not None
    assert result.id == voice_1.id

    # ---------------------------------------------------------
    # 4. Create generation
    # ---------------------------------------------------------

    generation_repository = GenerationRepository(db_session)

    generation = await generation_repository.create(
        user_id=user_1.id,
        voice_id=voice_1.id,
        input_text="Hello, this is a generated voice.",
        audio_path="storage/users/user1/generations/gen1.wav",
        generation_time=2.5,
        model="neutts",
    )

    assert generation.user_id == user_1.id
    assert generation.voice_id == voice_1.id

    # ---------------------------------------------------------
    # 5. Verify generation ownership
    # ---------------------------------------------------------

    result = await generation_repository.get_by_id(
        generation_id=generation.id,
        user_id=user_1.id,
    )

    assert result is not None
    assert result.id == generation.id

    result = await generation_repository.get_by_id(
        generation_id=generation.id,
        user_id=user_2.id,
    )

    assert result is None

    # ---------------------------------------------------------
    # 6. Verify generation belongs to correct voice
    # ---------------------------------------------------------

    generations = await generation_repository.list_by_voice(
        voice_id=voice_1.id,
        user_id=user_1.id,
    )

    assert len(generations) == 1
    assert generations[0].id == generation.id



@pytest.mark.asyncio
async def test_database_multiple_voices_per_user(db_session):
    user_repository = UserRepository(db_session)
    user = await user_repository.create("Multi Voice User")

    voice_repository = VoiceProfileRepository(db_session)

    voice_1 = await voice_repository.create(
        user_id=user.id,
        name="Voice One",
        processed_audio_path="voice1.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    voice_2 = await voice_repository.create(
        user_id=user.id,
        name="Voice Two",
        processed_audio_path="voice2.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    voice_3 = await voice_repository.create(
        user_id=user.id,
        name="Voice Three",
        processed_audio_path="voice3.wav",
        status=VoiceStatus.PROCESSING,
        model="neutts",
    )

    voices = await voice_repository.list_by_user(user.id)

    voice_ids = {voice.id for voice in voices}

    assert voice_1.id in voice_ids
    assert voice_2.id in voice_ids
    assert voice_3.id in voice_ids

    ready_voices = await voice_repository.list_ready_by_user(user.id)

    ready_ids = {voice.id for voice in ready_voices}

    assert voice_1.id in ready_ids
    assert voice_2.id in ready_ids
    assert voice_3.id not in ready_ids