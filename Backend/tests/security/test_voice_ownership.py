import pytest
import httpx
from unittest.mock import MagicMock
from app.db.postgres import get_db
from app.main import app
from app.models.voice_profile import VoiceStatus
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.security.jwt import create_access_token
from unittest.mock import AsyncMock, patch

from app.repositories.generation_repository import GenerationRepository

@pytest.mark.asyncio
async def test_owner_can_access_own_voice(
    db_session,
    create_test_user,
):
    user = await create_test_user(
        name="Voice Owner",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
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
                f"/api/voices/{voice.id}",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 200
        assert response.json()["id"] == str(voice.id)
        assert response.json()["name"] == "My Voice"

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_user_cannot_access_another_users_voice(
    db_session,
    create_test_user,
):
    owner = await create_test_user(
        name="Voice Owner",
    )

    other_user = await create_test_user(
        name="Other User",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=owner.id,
        name="Private Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    # Authenticate as the other user.
    token = create_access_token(other_user.id)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.state.neutts_service = MagicMock()

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                f"/api/voices/{voice.id}",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Voice not found."

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_user_cannot_generate_using_another_users_voice(
    db_session,
    create_test_user,
):
    owner = await create_test_user(
        name="Voice Owner",
    )

    other_user = await create_test_user(
        name="Other User",
    )

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=owner.id,
        name="Private Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    token = create_access_token(other_user.id)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.state.neutts_service = MagicMock()

    try:
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.post(
                f"/api/voices/{voice.id}/generate",
                headers={
                    "Authorization": f"Bearer {token}",
                },
                json={
                    "text": "This should not be generated.",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Voice not found."


    finally:

        if hasattr(app.state, "neutts_service"):
            del app.state.neutts_service

        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_user_cannot_delete_another_users_voice(
    db_session,
    create_test_user,
):
    owner = await create_test_user(name="Voice Owner")
    other_user = await create_test_user(name="Other User")

    voice_repository = VoiceProfileRepository(db_session)

    voice = await voice_repository.create(
        user_id=owner.id,
        name="Private Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

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
            response = await client.delete(
                f"/api/voices/{voice.id}",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Voice profile not found."

        # Verify the owner's voice still exists.
        remaining_voice = await voice_repository.get_by_id(
            voice_id=voice.id,
            user_id=owner.id,
        )

        assert remaining_voice is not None

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_user_cannot_access_another_users_audio(
    db_session,
    create_test_user,
):
    owner = await create_test_user(name="Voice Owner")
    other_user = await create_test_user(name="Other User")

    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    voice = await voice_repository.create(
        user_id=owner.id,
        name="Private Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation = await generation_repository.create(
        user_id=owner.id,
        voice_id=voice.id,
        input_text="Private generated audio.",
        audio_path="generation.wav",
        model="neutts",
        generation_time=1.0,
    )

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