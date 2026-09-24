import httpx
import pytest

from app.db.postgres import get_db
from app.main import app
from app.models.voice_profile import VoiceStatus
from app.repositories.generation_repository import GenerationRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.schemas import voice
from app.security.jwt import create_access_token
from app.services.voice_storage import VoiceStorageService


@pytest.mark.asyncio
async def test_list_voices_by_user(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)

    # Create two users
    user_a = await create_test_user(name="User A")
    user_b = await create_test_user(name="User B")

    # Create voices for User A
    voice_a1 = await voice_repository.create(
        user_id=user_a.id,
        name="User A Voice 1",
        processed_audio_path="storage/a/voice1/processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    voice_a2 = await voice_repository.create(
        user_id=user_a.id,
        name="User A Voice 2",
        processed_audio_path="storage/a/voice2/processed.wav",
        status=VoiceStatus.PROCESSING,
        model="neutts",
    )

    # Create voice for User B
    await voice_repository.create(
        user_id=user_b.id,
        name="User B Voice",
        processed_audio_path="storage/b/voice1/processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    # Verify repository behavior first
    voices = await voice_repository.list_by_user(
        user_id=user_a.id,
    )

    assert len(voices) == 2

    returned_ids = {voice.id for voice in voices}

    assert voice_a1.id in returned_ids
    assert voice_a2.id in returned_ids


@pytest.mark.asyncio
async def test_list_voices_api(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)

    # ---------------------------------------------------------
    # 1. Create users
    # ---------------------------------------------------------

    user_a = await create_test_user(
        name="List API User A"
    )

    user_b = await create_test_user(
        name="List API User B"
    )

    # ---------------------------------------------------------
    # 2. Create voices
    # ---------------------------------------------------------

    voice_a1 = await voice_repository.create(
        user_id=user_a.id,
        name="First Voice",
        processed_audio_path=(
            "storage/users/user_a/voices/voice1/processed.wav"
        ),
        status=VoiceStatus.READY,
        model="neutts",
    )

    voice_a2 = await voice_repository.create(
        user_id=user_a.id,
        name="Second Voice",
        processed_audio_path=(
            "storage/users/user_a/voices/voice2/processed.wav"
        ),
        status=VoiceStatus.PROCESSING,
        model="neutts",
    )

    await voice_repository.create(
        user_id=user_b.id,
        name="Other User Voice",
        processed_audio_path=(
            "storage/users/user_b/voices/voice1/processed.wav"
        ),
        status=VoiceStatus.READY,
        model="neutts",
    )

    # ---------------------------------------------------------
    # 3. Use the same DB session for FastAPI
    # ---------------------------------------------------------

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        # -----------------------------------------------------
        # 4. Call API
        # -----------------------------------------------------
        token = create_access_token(user_a.id)
        transport = httpx.ASGITransport(
            app=app,
        )

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:


            response = await client.get(
                "/api/voices",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        # -----------------------------------------------------
        # 5. Validate response
        # -----------------------------------------------------

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 2

        returned_ids = {
            item["id"]
            for item in data
        }

        assert str(voice_a1.id) in returned_ids
        assert str(voice_a2.id) in returned_ids

        # User B's voice must not appear
        assert all(
            item["user_id"] == str(user_a.id)
            for item in data
        )

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_voice_api(
    db_session,
    tmp_path,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)
    generation_repository = GenerationRepository(db_session)

    user = await create_test_user(
        name="Delete Test User"
    )

    voice = await voice_repository.create(
        user_id=user.id,
        name="Delete Me",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    # Create generation record
    generation = await generation_repository.create(
        user_id=user.id,
        voice_id=voice.id,
        input_text="Hello world",
        audio_path="generation.wav",
        generation_time=1.5,
        model="neutts",
    )

    # Create actual storage files
    storage = VoiceStorageService(
        base_dir=tmp_path,
    )

    voice_dir = storage.get_voice_directory(
        str(user.id),
        str(voice.id),
    )

    voice_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    processed_path = voice_dir / "processed.wav"
    reference_codes_path = voice_dir / "reference_codes.pt"

    processed_path.write_bytes(b"processed")
    reference_codes_path.write_bytes(b"reference")

    generation_path = storage.get_generation_path(
        user_id=user.id,
        generation_id=generation.id,
    )

    generation_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    generation_path.write_bytes(b"generated")

    # Use the test storage instance
    from app.api.routes import voices as voices_module

    original_storage = voices_module.voice_storage
    voices_module.voice_storage = storage

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    token = create_access_token(user.id)

    try:
        transport = httpx.ASGITransport(
            app=app,
        )

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

        assert response.status_code == 204

        # Voice DB record should be gone
        deleted_voice = await voice_repository.get_by_id(
            voice_id=voice.id,
            user_id=user.id,
        )

        assert deleted_voice is None

        # Generation DB record should be gone
        deleted_generation = (
            await generation_repository.get_by_id(
                generation_id=generation.id,
                user_id=user.id,
            )
        )

        assert deleted_generation is None

        # Storage files should be gone
        assert not processed_path.exists()
        assert not reference_codes_path.exists()
        assert not generation_path.exists()

    finally:
        voices_module.voice_storage = original_storage
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_voice_not_found(
    db_session,
    create_test_user,
):
    user = await create_test_user(
        name="Delete Not Found User"
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    token = create_access_token(user.id)

    try:
        transport = httpx.ASGITransport(
            app=app,
        )

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.delete(
                "/api/voices/00000000-0000-0000-0000-000000000000",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == (
            "Voice profile not found."
        )

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_voice_wrong_user(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)

    owner = await create_test_user(
        name="Voice Owner"
    )

    other_user = await create_test_user(
        name="Other User"
    )

    voice = await voice_repository.create(
        user_id=owner.id,
        name="Protected Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    token = create_access_token(other_user.id)

    try:
        transport = httpx.ASGITransport(
            app=app,
        )

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
        assert response.json()["detail"] == (
            "Voice profile not found."
        )

        # Owner's voice must still exist
        existing_voice = await voice_repository.get_by_id(
            voice_id=voice.id,
            user_id=owner.id,
        )

        assert existing_voice is not None

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_voices_requires_authentication(
    db_session,
):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(
            app=app,
        )

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                "/api/voices",
            )

        assert response.status_code == 401

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_voices_returns_only_current_users_voices(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(
        db_session
    )

    user_a = await create_test_user(
        name="Isolation User A",
    )

    user_b = await create_test_user(
        name="Isolation User B",
    )

    voice_a = await voice_repository.create(
        user_id=user_a.id,
        name="Private Voice A",
        processed_audio_path="storage/a/voice.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    voice_b = await voice_repository.create(
        user_id=user_b.id,
        name="Private Voice B",
        processed_audio_path="storage/b/voice.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user_a.id)

    try:
        transport = httpx.ASGITransport(
            app=app,
        )

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.get(
                "/api/voices",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 200

        data = response.json()

        returned_ids = {
            item["id"]
            for item in data
        }

        assert str(voice_a.id) in returned_ids
        assert str(voice_b.id) not in returned_ids

        assert all(
            item["user_id"] == str(user_a.id)
            for item in data
        )

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_voice_api(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user(
        name="Voice Detail User",
    )

    voice = await voice_repository.create(
        user_id=user.id,
        name="My Private Voice",
        processed_audio_path="storage/user/voice.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user.id)

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

        data = response.json()

        assert data["id"] == str(voice.id)
        assert data["user_id"] == str(user.id)
        assert data["name"] == "My Private Voice"

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_voice_requires_authentication(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)

    user = await create_test_user()

    voice = await voice_repository.create(
        user_id=user.id,
        name="Protected Voice",
        processed_audio_path="storage/protected/voice.wav",
        status=VoiceStatus.READY,
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
                f"/api/voices/{voice.id}",
            )

        assert response.status_code == 401

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_voice_cannot_access_other_users_voice(
    db_session,
    create_test_user,
):
    voice_repository = VoiceProfileRepository(db_session)

    user_a = await create_test_user(
        name="Voice Owner",
    )

    user_b = await create_test_user(
        name="Other User",
    )

    voice_a = await voice_repository.create(
        user_id=user_a.id,
        name="Private Voice A",
        processed_audio_path="storage/a/voice.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    token_b = create_access_token(user_b.id)

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
                f"/api/voices/{voice_a.id}",
                headers={
                    "Authorization": f"Bearer {token_b}",
                },
            )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_delete_voice_requires_authentication(
    db_session,
    create_test_user,
):
    user = await create_test_user(
        name="Delete Auth Test User",
    )

    voice_repository = VoiceProfileRepository(
        db_session
    )

    voice = await voice_repository.create(
        user_id=user.id,
        name="Protected Delete Voice",
        processed_audio_path="processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = httpx.ASGITransport(
            app=app,
        )

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.delete(
                f"/api/voices/{voice.id}",
            )

        assert response.status_code == 401

    finally:
        app.dependency_overrides.clear()