from pathlib import Path
from uuid import uuid4

import httpx
import pytest

from app.db.postgres import get_db
from app.main import app
from app.repositories.generation_repository import GenerationRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.security.jwt import create_access_token
from app.models.voice_profile import VoiceStatus
from app.services.voice_storage import VoiceStorageService


@pytest.mark.asyncio
async def test_owner_can_access_generation_audio(
    db_session,
    create_test_user,
    tmp_path,
):
    user = await create_test_user(
        name="Audio Owner",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=user.id,
        name="Test Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation_repository = GenerationRepository(db_session)

    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Hello from the test.",
        audio_path="placeholder.wav",
        generation_time=1.0,
        model="neutts",
    )

    # Create a real WAV file at the location expected by
    # VoiceStorageService.
    audio_dir = (
        Path("storage")
        / "users"
        / str(user.id)
        / "generations"
    )

    audio_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    audio_path = audio_dir / f"{generation.id}.wav"

    # Minimal valid WAV file.
    import soundfile as sf
    import numpy as np

    audio = np.zeros(24000, dtype=np.float32)

    sf.write(
        audio_path,
        audio,
        24000,
        subtype="PCM_16",
    )

    token = create_access_token(user.id)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                f"/api/voices/{voice.id}/generations/"
                f"{generation.id}/audio",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 200
        assert response.headers["content-type"] == "audio/wav"
        assert len(response.content) > 0

    finally:
        app.dependency_overrides.clear()
        audio_path.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_generation_audio_requires_authentication(
    db_session,
    create_test_user,
):
    user = await create_test_user(
        name="Audio Auth Test User",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=user.id,
        name="Protected Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation_repository = GenerationRepository(db_session)

    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Protected audio.",
        audio_path="placeholder.wav",
        generation_time=1.0,
        model="neutts",
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                f"/api/voices/{voice.id}/generations/"
                f"{generation.id}/audio",
            )

        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_other_user_cannot_access_generation_audio(
    db_session,
    create_test_user,
):
    owner = await create_test_user(
        name="Audio Owner",
    )

    other_user = await create_test_user(
        name="Other Audio User",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=owner.id,
        name="Owner Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation_repository = GenerationRepository(db_session)

    generation = await generation_repository.create(
        user_id=owner.id,
        voice_id=voice.id,
        input_text="Private generated audio.",
        audio_path="placeholder.wav",
        generation_time=1.0,
        model="neutts",
    )

    # Create the actual audio file.
    audio_dir = (
        Path("storage")
        / "users"
        / str(owner.id)
        / "generations"
    )

    audio_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    audio_path = audio_dir / f"{generation.id}.wav"

    import soundfile as sf
    import numpy as np

    audio = np.zeros(
        24000,
        dtype=np.float32,
    )

    sf.write(
        audio_path,
        audio,
        24000,
        subtype="PCM_16",
    )

    # Authenticate as the OTHER user.
    token = create_access_token(other_user.id)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                f"/api/voices/{voice.id}/generations/"
                f"{generation.id}/audio",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Generation not found."

    finally:
        app.dependency_overrides.clear()
        audio_path.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_generation_audio_requires_matching_voice(
    db_session,
    create_test_user,
):
    user = await create_test_user(
        name="Voice Match User",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=user.id,
        name="Original Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    other_voice = await voice_repository.create(
        user_id=user.id,
        name="Other Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation_repository = GenerationRepository(db_session)

    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Voice matching test.",
        audio_path="placeholder.wav",
        generation_time=1.0,
        model="neutts",
    )

    token = create_access_token(user.id)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                f"/api/voices/{other_voice.id}/generations/"
                f"{generation.id}/audio",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Generation not found."

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_generation_audio_returns_404_when_file_missing(
    db_session,
    create_test_user,
):
    user = await create_test_user(
        name="Missing Audio User",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=user.id,
        name="Missing Audio Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation_repository = GenerationRepository(db_session)

    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Missing audio test.",
        audio_path="placeholder.wav",
        generation_time=1.0,
        model="neutts",
    )

    token = create_access_token(user.id)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                f"/api/voices/{voice.id}/generations/"
                f"{generation.id}/audio",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Audio file not found."

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_generation_audio_blocks_unsafe_storage_path(
    db_session,
    create_test_user,
    monkeypatch,
):
    user = await create_test_user(
        name="Path Security User",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=user.id,
        name="Path Security Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation_repository = GenerationRepository(db_session)

    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Path traversal test.",
        audio_path="placeholder.wav",
        generation_time=1.0,
        model="neutts",
    )

    # Return a path outside the storage directory.
    unsafe_path = Path("outside_storage") / "secret.wav"

    monkeypatch.setattr(
        VoiceStorageService,
        "get_generation_path",
        lambda self, user_id, generation_id: unsafe_path,
    )

    token = create_access_token(user.id)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                f"/api/voices/{voice.id}/generations/"
                f"{generation.id}/audio",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Audio file not found."

    finally:
        app.dependency_overrides.clear()