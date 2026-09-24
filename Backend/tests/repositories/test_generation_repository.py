from uuid import uuid4

import pytest

from app.models.voice_profile import VoiceStatus
from app.repositories.generation_repository import GenerationRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository


@pytest.mark.asyncio
async def test_create_generation(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    user = await create_test_user()

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/voice.wav",
        status=VoiceStatus.READY,
    )

    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Hello world",
        audio_path="storage/generations/gen.wav",
        generation_time=2.5,
    )

    assert generation.id is not None
    assert generation.user_id == user.id
    assert generation.voice_id == voice.id
    assert generation.input_text == "Hello world"
    assert generation.audio_path.endswith("gen.wav")
    assert generation.model == "neutts"
    assert generation.generation_time == 2.5


@pytest.mark.asyncio
async def test_get_generation_by_id(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    user = await create_test_user()

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/voice.wav",
    )

    created = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Hello",
        audio_path="storage/gen.wav",
        generation_time=1.5,
    )

    generation = await generation_repository.get_by_id(
        generation_id=created.id,
        user_id=user.id,
    )

    assert generation is not None
    assert generation.id == created.id


@pytest.mark.asyncio
async def test_get_nonexistent_generation(db_session, create_test_user):
    generation_repository = GenerationRepository(db_session)

    user = await create_test_user()

    generation = await generation_repository.get_by_id(
        generation_id=uuid4(),
        user_id=user.id,
    )

    assert generation is None


@pytest.mark.asyncio
async def test_list_generations_by_user(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    user = await create_test_user()

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/voice.wav",
    )

    await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="First",
        audio_path="storage/first.wav",
        generation_time=1.0,
    )

    await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Second",
        audio_path="storage/second.wav",
        generation_time=2.0,
    )

    generations = await generation_repository.list_by_user(user.id)

    assert len(generations) == 2
    assert generations[0].input_text == "First"
    assert generations[1].input_text == "Second"


@pytest.mark.asyncio
async def test_list_generations_by_voice(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    user = await create_test_user()

    voice1 = await voice_repository.create(
        user_id=user.id,
        name="Voice One",
        processed_audio_path="storage/voice1.wav",
    )

    voice2 = await voice_repository.create(
        user_id=user.id,
        name="Voice Two",
        processed_audio_path="storage/voice2.wav",
    )

    await generation_repository.create(
        user_id=user.id,
        voice_id=voice1.id,
        input_text="Voice one generation",
        audio_path="storage/gen1.wav",
        generation_time=1.0,
    )

    await generation_repository.create(
        user_id=user.id,
        voice_id=voice2.id,
        input_text="Voice two generation",
        audio_path="storage/gen2.wav",
        generation_time=1.0,
    )

    generations = await generation_repository.list_by_voice(
        voice_id=voice1.id,
        user_id=user.id,
    )

    assert len(generations) == 1
    assert generations[0].voice_id == voice1.id
    assert generations[0].input_text == "Voice one generation"


@pytest.mark.asyncio
async def test_delete_generation(db_session, create_test_user):
    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    user = await create_test_user()

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="storage/voice.wav",
    )

    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Delete me",
        audio_path="storage/delete.wav",
        generation_time=1.0,
    )

    deleted = await generation_repository.delete(
        generation_id=generation.id,
        user_id=user.id,
    )

    assert deleted is True

    result = await generation_repository.get_by_id(
        generation_id=generation.id,
        user_id=user.id,
    )

    assert result is None


@pytest.mark.asyncio
async def test_user_cannot_access_another_users_generation(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    user1 = await create_test_user(name="User One")
    user2 = await create_test_user(name="User Two")

    voice = await voice_repository.create(
        user_id=user1.id,
        name="User One Voice",
        processed_audio_path="storage/voice.wav",
    )

    generation = await generation_repository.create(
        user_id=user1.id,
        voice_id=voice.id,
        input_text="Private generation",
        audio_path="storage/private.wav",
        generation_time=1.0,
    )

    result = await generation_repository.get_by_id(
        generation_id=generation.id,
        user_id=user2.id,
    )

    assert result is None