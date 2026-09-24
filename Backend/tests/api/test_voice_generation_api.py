from pathlib import Path
from unittest.mock import Mock
from uuid import UUID

import numpy as np
import pytest
import soundfile as sf
import torch
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings
from app.db.postgres import get_db
from app.main import app
from app.models.voice_profile import VoiceStatus
from app.repositories.generation_repository import GenerationRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.security.jwt import create_access_token


@pytest.mark.asyncio
async def test_generate_voice_api(
    tmp_path,
    db_session,
    create_test_user,
):
    # ---------------------------------------------------------
    # 1. Create test user
    # ---------------------------------------------------------

    user = await create_test_user(
        name="Generation API Test User"
    )

    token = create_access_token(user.id)

    # ---------------------------------------------------------
    # 2. Create voice profile storage
    # ---------------------------------------------------------

    voice_id = UUID(
        "11111111-1111-1111-1111-111111111111"
    )

    voice_directory = (
        tmp_path
        / "users"
        / str(user.id)
        / "voices"
        / str(voice_id)
    )

    voice_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    reference_codes_path = (
        voice_directory / "reference_codes.pt"
    )

    torch.save(
        {"fake": "reference_codes"},
        reference_codes_path,
    )

    processed_audio_path = (
        voice_directory / "processed.wav"
    )

    # The actual audio isn't used by generation, but the
    # voice profile should contain a valid processed path.
    processed_audio_path.touch()

    # ---------------------------------------------------------
    # 3. Create READY voice profile
    # ---------------------------------------------------------

    voice_repository = VoiceProfileRepository(
        db_session
    )

    voice = await voice_repository.create(
        user_id=user.id,
        name="Generation Test Voice",
        processed_audio_path=str(
            processed_audio_path
        ),
        status=VoiceStatus.READY,
        model="neutts",
    )

    # ---------------------------------------------------------
    # 4. Add NeuTTS reference data
    # ---------------------------------------------------------

    voice = await voice_repository.update_reference_data(
        voice_id=voice.id,
        user_id=user.id,
        reference_codes_path=str(
            reference_codes_path
        ),
        reference_text=(
            "This is the reference speaker."
        ),
    )

    assert voice is not None

    # ---------------------------------------------------------
    # 5. Give FastAPI its OWN NullPool database session
    # ---------------------------------------------------------

    test_engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        poolclass=NullPool,
    )

    TestSessionLocal = async_sessionmaker(
        bind=test_engine,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    # ---------------------------------------------------------
    # 6. Create mocked NeuTTS service
    # ---------------------------------------------------------

    mock_neutts_service = Mock()

    mock_neutts_service.infer.return_value = np.zeros(
        24000,
        dtype=np.float32,
    )

    try:
        # -----------------------------------------------------
        # 7. Tell FastAPI lifespan to use the mock
        # -----------------------------------------------------

        app.state.neutts_service_factory = (
            lambda: mock_neutts_service
        )

        # -----------------------------------------------------
        # 8. Start TestClient
        # -----------------------------------------------------

        with TestClient(app) as client:

            # -------------------------------------------------
            # 9. Generate speech
            # -------------------------------------------------

            response = client.post(
                f"/api/voices/{voice.id}/generate",
                headers={
                    "Authorization": f"Bearer {token}",
                },
                json={
                    "text": (
                        "Hello, this is my generated voice."
                    ),
                },
            )

            # -------------------------------------------------
            # 10. Validate HTTP response
            # -------------------------------------------------

            assert response.status_code == 201

            data = response.json()

            generation_id = UUID(data["id"])

            assert generation_id is not None

            assert UUID(data["user_id"]) == user.id

            assert UUID(data["voice_id"]) == voice.id

            assert data["input_text"] == (
                "Hello, this is my generated voice."
            )

            assert data["model"] == "neutts"

            assert data["audio_path"]

            assert data["generation_time"] >= 0

            assert data["created_at"]

            # -------------------------------------------------
            # 11. Verify generated audio file
            # -------------------------------------------------

            audio_file = Path(data["audio_path"])

            assert audio_file.exists()
            assert audio_file.is_file()

            audio, sample_rate = sf.read(audio_file)

            assert sample_rate == 24000
            assert len(audio) == 24000

            # -------------------------------------------------
            # 12. Verify PostgreSQL Generation record
            # -------------------------------------------------

            generation_repository = GenerationRepository(
                db_session
            )

            stored_generation = (
                await generation_repository.get_by_id(
                    generation_id=generation_id,
                    user_id=user.id,
                )
            )

            assert stored_generation is not None
            assert stored_generation.id == generation_id
            assert stored_generation.user_id == user.id
            assert stored_generation.voice_id == voice.id
            assert stored_generation.input_text == (
                "Hello, this is my generated voice."
            )
            assert stored_generation.model == "neutts"
            assert (
                stored_generation.audio_path
                == data["audio_path"]
            )
            assert stored_generation.generation_time >= 0

            # -------------------------------------------------
            # 13. Verify NeuTTS inference
            # -------------------------------------------------

            mock_neutts_service.infer.assert_called_once()

    finally:
        # -----------------------------------------------------
        # Clean up FastAPI dependency overrides
        # -----------------------------------------------------

        app.dependency_overrides.clear()

        # -----------------------------------------------------
        # Clean up NeuTTS test factory
        # -----------------------------------------------------

        if hasattr(
            app.state,
            "neutts_service_factory",
        ):
            del app.state.neutts_service_factory

        await test_engine.dispose()


@pytest.mark.asyncio
async def test_generate_voice_requires_authentication(
    tmp_path,
    db_session,
    create_test_user,
):
    user = await create_test_user(
        name="Generation Auth Test User"
    )

    voice_repository = VoiceProfileRepository(
        db_session
    )

    voice = await voice_repository.create(
        user_id=user.id,
        name="Protected Generation Voice",
        processed_audio_path=str(
            tmp_path / "processed.wav"
        ),
        status=VoiceStatus.READY,
        model="neutts",
    )

    mock_neutts_service = Mock()

    try:
        app.state.neutts_service_factory = (
            lambda: mock_neutts_service
        )

        with TestClient(app) as client:
            response = client.post(
                f"/api/voices/{voice.id}/generate",
                json={
                    "text": "This must not be generated.",
                },
            )

        assert response.status_code == 401
        mock_neutts_service.infer.assert_not_called()

    finally:
        if hasattr(
            app.state,
            "neutts_service_factory",
        ):
            del app.state.neutts_service_factory


@pytest.mark.asyncio
async def test_generate_voice_cannot_access_other_users_voice(
    tmp_path,
    db_session,
    create_test_user,
):
    user_a = await create_test_user(
        name="Generation Owner",
    )

    user_b = await create_test_user(
        name="Generation Attacker",
    )

    voice_repository = VoiceProfileRepository(
        db_session
    )

    voice = await voice_repository.create(
        user_id=user_a.id,
        name="Private Generation Voice",
        processed_audio_path=str(
            tmp_path / "processed.wav"
        ),
        status=VoiceStatus.READY,
        model="neutts",
    )

    token_b = create_access_token(user_b.id)

    # Use a fresh NullPool engine because TestClient runs the
    # FastAPI app in another event loop on Windows.
    test_engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        poolclass=NullPool,
    )

    TestSessionLocal = async_sessionmaker(
        bind=test_engine,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    mock_neutts_service = Mock()

    mock_neutts_service.infer.return_value = np.zeros(
        24000,
        dtype=np.float32,
    )

    try:
        app.state.neutts_service_factory = (
            lambda: mock_neutts_service
        )

        with TestClient(app) as client:
            response = client.post(
                f"/api/voices/{voice.id}/generate",
                headers={
                    "Authorization": f"Bearer {token_b}",
                },
                json={
                    "text": "This must not be generated.",
                },
            )

        assert response.status_code == 404

        mock_neutts_service.infer.assert_not_called()

    finally:
        app.dependency_overrides.clear()

        if hasattr(
            app.state,
            "neutts_service_factory",
        ):
            del app.state.neutts_service_factory

        await test_engine.dispose()
