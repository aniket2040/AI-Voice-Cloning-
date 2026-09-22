from uuid import UUID
from unittest.mock import Mock
import soundfile as sf
import numpy as np
import pytest
import torch
from fastapi.testclient import TestClient
from pathlib import Path
from app.repositories.generation_repository import GenerationRepository
from app.db.postgres import AsyncSessionLocal, get_db
from app.main import app
from app.repositories.user_repository import UserRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.models.voice_profile import VoiceStatus


@pytest.mark.asyncio
async def test_generate_voice_api(
    tmp_path,
    db_session,
):
    # ---------------------------------------------------------
    # 1. Create test user
    # ---------------------------------------------------------

    user_repository = UserRepository(db_session)

    user = await user_repository.create(
        "Generation API Test User"
    )

    # ---------------------------------------------------------
    # 2. Create voice profile storage
    # ---------------------------------------------------------

    voice_id = UUID("11111111-1111-1111-1111-111111111111")

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
    # 5. Give FastAPI its OWN database session
    # ---------------------------------------------------------

    async def override_get_db():
        async with AsyncSessionLocal() as session:
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
                params={
                    "user_id": str(user.id),
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

            stored_generation = await generation_repository.get_by_id(
                generation_id=generation_id,
                user_id=user.id,
            )

            assert stored_generation is not None
            assert stored_generation.id == generation_id
            assert stored_generation.user_id == user.id
            assert stored_generation.voice_id == voice.id
            assert stored_generation.input_text == (
                "Hello, this is my generated voice."
            )
            assert stored_generation.model == "neutts"
            assert stored_generation.audio_path == data["audio_path"]
            assert stored_generation.generation_time >= 0

            # -------------------------------------------------
            # 13. Verify NeuTTS inference
            # -------------------------------------------------

            mock_neutts_service.infer.assert_called_once()

    finally:
        # -----------------------------------------------------
        # 12. Clean up FastAPI dependency overrides
        # -----------------------------------------------------

        app.dependency_overrides.clear()

        # -----------------------------------------------------
        # 13. Clean up NeuTTS test factory
        # -----------------------------------------------------

        if hasattr(
            app.state,
            "neutts_service_factory",
        ):
            del app.state.neutts_service_factory