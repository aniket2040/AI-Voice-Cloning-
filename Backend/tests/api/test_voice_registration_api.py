from pathlib import Path
from unittest.mock import Mock
from uuid import UUID

import httpx
import numpy as np
import pytest
import soundfile as sf

from app.db.postgres import get_db
from app.main import app
from app.repositories.user_repository import UserRepository
from app.repositories.voice_profile_repository import VoiceProfileRepository


@pytest.mark.asyncio
async def test_register_voice_api(
    db_session,
):
    # ---------------------------------------------------------
    # 1. Create test user
    # ---------------------------------------------------------

    user_repository = UserRepository(db_session)

    user = await user_repository.create(
        "Registration API Test User"
    )

    # ---------------------------------------------------------
    # 2. Create temporary upload directory
    # ---------------------------------------------------------

    temp_upload_dir = Path(
        "storage/temp_uploads"
    )

    temp_upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_filename = (
        f"test_registration_{user.id}.wav"
    )

    temporary_path = (
        temp_upload_dir / temporary_filename
    )

    # ---------------------------------------------------------
    # 3. Create valid test audio
    # ---------------------------------------------------------

    sample_rate = 16000

    audio = np.full(
        sample_rate * 5,
        0.1,
        dtype=np.float32,
    )

    sf.write(
        temporary_path,
        audio,
        sample_rate,
        subtype="PCM_16",
    )

    # ---------------------------------------------------------
    # 4. Create mocked NeuTTS service
    # ---------------------------------------------------------

    mock_neutts_service = Mock()

    mock_reference_codes = {
        "fake": "reference_codes",
    }

    mock_neutts_service.encode_reference.return_value = (
        mock_reference_codes
    )

    # ---------------------------------------------------------
    # 5. Override FastAPI database dependency
    #
    # IMPORTANT:
    # Use the SAME pytest database session/event loop.
    # Do not create another AsyncSessionLocal here.
    # ---------------------------------------------------------

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # ---------------------------------------------------------
    # 6. Inject mocked NeuTTS directly
    #
    # We are not using TestClient, so FastAPI lifespan is not
    # responsible for creating this service.
    # ---------------------------------------------------------

    original_neutts_service = getattr(
        app.state,
        "neutts_service",
        None,
    )

    app.state.neutts_service = mock_neutts_service

    try:
        # -----------------------------------------------------
        # 7. Create ASGI transport
        #
        # AsyncClient keeps the request on the same event loop
        # as pytest and db_session.
        # -----------------------------------------------------

        transport = httpx.ASGITransport(
            app=app,
        )

        # -----------------------------------------------------
        # 8. Send API request
        # -----------------------------------------------------

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.post(
                "/api/voices/register",
                data={
                    "user_id": str(user.id),
                    "voice_name": (
                        "Registration Test Voice"
                    ),
                    "temporary_file": (
                        temporary_filename
                    ),
                    "reference_text": (
                        "This is the reference speaker."
                    ),
                },
            )

        # -----------------------------------------------------
        # 9. Validate HTTP response
        # -----------------------------------------------------

        assert response.status_code == 201

        data = response.json()

        voice_id = UUID(
            data["id"]
        )

        assert UUID(
            data["user_id"]
        ) == user.id

        assert (
            data["name"]
            == "Registration Test Voice"
        )

        assert (
            data["status"]
            == "READY"
        )

        assert (
            data["model"]
            == "neutts"
        )

        assert data[
            "processed_audio_path"
        ]

        assert data[
            "reference_codes_path"
        ]

        assert (
            data["reference_text"]
            == "This is the reference speaker."
        )

        # -----------------------------------------------------
        # 10. Verify NeuTTS reference encoding
        # -----------------------------------------------------

        mock_neutts_service.encode_reference.assert_called_once()

        encoded_audio_path = (
            mock_neutts_service
            .encode_reference
            .call_args.args[0]
        )

        assert Path(
            encoded_audio_path
        ).exists()

        # -----------------------------------------------------
        # 11. Verify database record
        # -----------------------------------------------------

        voice_repository = VoiceProfileRepository(
            db_session
        )

        stored_voice = (
            await voice_repository.get_by_id(
                voice_id=voice_id,
                user_id=user.id,
            )
        )

        assert stored_voice is not None

        assert (
            stored_voice.id
            == voice_id
        )

        assert (
            stored_voice.user_id
            == user.id
        )

        assert (
            stored_voice.name
            == "Registration Test Voice"
        )

        assert (
            stored_voice.status.value
            == "READY"
        )

        assert (
            stored_voice.reference_text
            == "This is the reference speaker."
        )

        assert (
            stored_voice.reference_codes_path
        )

        # -----------------------------------------------------
        # 12. Verify processed audio file
        # -----------------------------------------------------

        processed_path = Path(
            stored_voice.processed_audio_path
        )

        assert (
            processed_path.exists()
        )

        assert (
            processed_path.is_file()
        )

        # -----------------------------------------------------
        # 13. Verify reference codes file
        # -----------------------------------------------------

        reference_codes_path = Path(
            stored_voice.reference_codes_path
        )

        assert (
            reference_codes_path.exists()
        )

        assert (
            reference_codes_path.is_file()
        )

    finally:
        # -----------------------------------------------------
        # 14. Restore FastAPI state
        # -----------------------------------------------------

        app.dependency_overrides.clear()

        if original_neutts_service is not None:
            app.state.neutts_service = (
                original_neutts_service
            )
        elif hasattr(
            app.state,
            "neutts_service",
        ):
            del app.state.neutts_service

        # -----------------------------------------------------
        # 15. Cleanup temporary upload
        # -----------------------------------------------------

        temporary_path.unlink(
            missing_ok=True
        )