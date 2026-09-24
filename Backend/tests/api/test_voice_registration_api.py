from pathlib import Path
from unittest.mock import Mock
from uuid import UUID

import httpx
import numpy as np
import pytest
import soundfile as sf

from app.db.postgres import get_db
from app.main import app
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.security.jwt import create_access_token


@pytest.mark.asyncio
async def test_register_voice_api(
    db_session,
    create_test_user,
):
    # ---------------------------------------------------------
    # 1. Create test user
    # ---------------------------------------------------------

    user = await create_test_user(
        name="Registration API Test User"
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
    # ---------------------------------------------------------

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # ---------------------------------------------------------
    # 6. Inject mocked NeuTTS directly
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
        # -----------------------------------------------------

        transport = httpx.ASGITransport(
            app=app,
        )

        # -----------------------------------------------------
        # 8. Send API request
        # -----------------------------------------------------
        token = create_access_token(user.id)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:

            response = await client.post(
                "/api/voices/register",
                headers={
                    "Authorization": f"Bearer {token}",
                },
                data={
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

        voice_id = UUID(data["id"])

        assert UUID(data["user_id"]) == user.id

        assert (
            data["name"]
            == "Registration Test Voice"
        )

        assert data["status"] == "READY"

        assert data["model"] == "neutts"

        assert data["processed_audio_path"]

        assert data["reference_codes_path"]

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

        assert Path(encoded_audio_path).exists()

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

        assert stored_voice.id == voice_id

        assert stored_voice.user_id == user.id

        assert (
            stored_voice.name
            == "Registration Test Voice"
        )

        assert stored_voice.status.value == "READY"

        assert (
            stored_voice.reference_text
            == "This is the reference speaker."
        )

        assert stored_voice.reference_codes_path

        # -----------------------------------------------------
        # 12. Verify processed audio file
        # -----------------------------------------------------

        processed_path = Path(
            stored_voice.processed_audio_path
        )

        assert processed_path.exists()

        assert processed_path.is_file()

        # -----------------------------------------------------
        # 13. Verify reference codes file
        # -----------------------------------------------------

        reference_codes_path = Path(
            stored_voice.reference_codes_path
        )

        assert reference_codes_path.exists()

        assert reference_codes_path.is_file()

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

def create_test_audio(path: Path) -> None:
    sample_rate = 16000

    audio = np.full(
        sample_rate * 5,
        0.1,
        dtype=np.float32,
    )

    sf.write(
        path,
        audio,
        sample_rate,
        subtype="PCM_16",
    )

@pytest.mark.asyncio
async def test_upload_voice_requires_authentication(tmp_path):
    audio_path = tmp_path / "test_upload.wav"

    create_test_audio(audio_path)

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        with audio_path.open("rb") as audio_file:
            response = await client.post(
                "/api/voices/upload",
                files={
                    "file": (
                        "test_upload.wav",
                        audio_file,
                        "audio/wav",
                    )
                },
            )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_voice_with_authentication(
    db_session,
    create_test_user,
    tmp_path,
):
    user = await create_test_user(
        name="Upload API Test User"
    )

    audio_path = tmp_path / "test_upload.wav"

    create_test_audio(audio_path)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user.id)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            with audio_path.open("rb") as audio_file:
                response = await client.post(
                    "/api/voices/upload",
                    headers={
                        "Authorization": f"Bearer {token}"
                    },
                    files={
                        "file": (
                            "test_upload.wav",
                            audio_file,
                            "audio/wav",
                        )
                    },
                )

        assert response.status_code == 201

        data = response.json()

        assert data["status"] == "uploaded"
        assert data["message"] == (
            "Voice sample uploaded successfully."
        )
        assert data["temporary_file"]
        assert data["size_bytes"] > 0
        assert data["audio"]

        temporary_filename = data["temporary_file"]

        temporary_path = (
            Path("storage/temp_uploads")
            / temporary_filename
        )

        # Upload endpoint should actually create the temporary file.
        assert temporary_path.exists()

        # Cleanup because registration hasn't consumed it.
        temporary_path.unlink(missing_ok=True)

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_voice_requires_authentication(
    tmp_path,
):
    temporary_path = tmp_path / "test_registration.wav"

    create_test_audio(temporary_path)

    # Copy it to the application's temporary upload directory.
    temp_upload_dir = Path("storage/temp_uploads")
    temp_upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_filename = (
        f"test_auth_required_{temporary_path.stem}.wav"
    )

    application_temp_path = (
        temp_upload_dir / temporary_filename
    )

    temporary_path.replace(application_temp_path)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/voices/register",
                data={
                    "voice_name": "Unauthorized Voice",
                    "temporary_file": temporary_filename,
                    "reference_text": (
                        "This is the reference speaker."
                    ),
                },
            )

        assert response.status_code == 401

    finally:
        application_temp_path.unlink(
            missing_ok=True
        )

@pytest.mark.asyncio
async def test_register_voice_uses_authenticated_user(
    db_session,
    create_test_user,
):
    user_a = await create_test_user(
        name="User A",
    )

    user_b = await create_test_user(
        name="User B",
    )

    assert user_a.id != user_b.id

    temp_upload_dir = Path(
        "storage/temp_uploads"
    )

    temp_upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_filename = (
        f"test_authenticated_owner_{user_a.id}.wav"
    )

    temporary_path = (
        temp_upload_dir / temporary_filename
    )

    create_test_audio(temporary_path)

    mock_neutts_service = Mock()

    mock_neutts_service.encode_reference.return_value = {
        "fake": "reference_codes",
    }

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    original_neutts_service = getattr(
        app.state,
        "neutts_service",
        None,
    )

    app.state.neutts_service = mock_neutts_service

    token = create_access_token(user_a.id)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:

            response = await client.post(
                "/api/voices/register",
                headers={
                    "Authorization": f"Bearer {token}",
                },
                data={
                    "voice_name": "User A Voice",
                    "temporary_file": temporary_filename,
                    "reference_text": (
                        "This is the reference speaker."
                    ),
                },
            )

        assert response.status_code == 201

        data = response.json()

        voice_id = UUID(data["id"])

        assert UUID(data["user_id"]) == user_a.id
        assert UUID(data["user_id"]) != user_b.id

    finally:
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

        temporary_path.unlink(
            missing_ok=True
        )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "malicious_filename",
    [
        "../../secret.wav",
        r"..\..\secret.wav",
        "/tmp/secret.wav",
        r"C:\secret.wav",
    ],
)
async def test_upload_ignores_malicious_filename(
    db_session,
    create_test_user,
    tmp_path,
    malicious_filename,
):
    user = await create_test_user(
        name="Filename Security Test User"
    )

    audio_path = tmp_path / "valid_audio.wav"
    create_test_audio(audio_path)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user.id)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            with audio_path.open("rb") as audio_file:
                response = await client.post(
                    "/api/voices/upload",
                    headers={
                        "Authorization": f"Bearer {token}",
                    },
                    files={
                        "file": (
                            malicious_filename,
                            audio_file,
                            "audio/wav",
                        )
                    },
                )

        assert response.status_code == 201

        data = response.json()
        temporary_filename = data["temporary_file"]

        # The client-controlled filename must never become
        # the temporary filesystem filename.
        assert temporary_filename != malicious_filename

        # It must be a simple filename, not a path.
        assert Path(temporary_filename).name == temporary_filename

        # It must not contain path traversal components.
        assert ".." not in temporary_filename
        assert "/" not in temporary_filename
        assert "\\" not in temporary_filename

        # The generated temporary file must exist.
        temporary_path = (
            Path("storage/temp_uploads")
            / temporary_filename
        )

        assert temporary_path.is_file()

        temporary_path.unlink(missing_ok=True)

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_rejects_filename_without_supported_extension(
    db_session,
    create_test_user,
    tmp_path,
):
    user = await create_test_user(
        name="Filename Extension Test User"
    )

    audio_path = tmp_path / "valid_audio.wav"
    create_test_audio(audio_path)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user.id)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            with audio_path.open("rb") as audio_file:
                response = await client.post(
                    "/api/voices/upload",
                    headers={
                        "Authorization": f"Bearer {token}",
                    },
                    files={
                        "file": (
                            "/etc/passwd",
                            audio_file,
                            "audio/wav",
                        )
                    },
                )

        assert response.status_code == 415

    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "malicious_filename",
    [
        "../../secret.wav",
        r"..\..\secret.wav",
        "/etc/passwd",
        r"C:\secret.wav",
    ],
)
async def test_register_rejects_malicious_temporary_filename(
    db_session,
    create_test_user,
    malicious_filename,
):
    user = await create_test_user(
        name="Registration Filename Security User"
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user.id)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/voices/register",
                headers={
                    "Authorization": f"Bearer {token}",
                },
                data={
                    "voice_name": "Malicious Voice",
                    "temporary_file": malicious_filename,
                    "reference_text": "This is a reference voice sample.",
                },
            )

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid temporary file."

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_mime_type(
    db_session,
    create_test_user,
    tmp_path,
):
    user = await create_test_user(
        name="MIME Security Test User"
    )

    audio_path = tmp_path / "valid_audio.wav"
    create_test_audio(audio_path)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user.id)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            with audio_path.open("rb") as audio_file:
                response = await client.post(
                    "/api/voices/upload",
                    headers={
                        "Authorization": f"Bearer {token}",
                    },
                    files={
                        "file": (
                            "valid_audio.wav",
                            audio_file,
                            "application/pdf",
                        )
                    },
                )

        assert response.status_code == 415
        assert response.json()["detail"] == (
            "Unsupported audio content type."
        )

    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_upload_rejects_renamed_non_audio_file(
    db_session,
    create_test_user,
    tmp_path,
):
    user = await create_test_user(
        name="Renamed Non Audio Test User"
    )

    fake_audio_path = tmp_path / "fake.wav"

    fake_audio_path.write_bytes(
        b"%PDF-1.7\n"
        b"This is actually a PDF, not audio.\n"
    )

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    token = create_access_token(user.id)

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            with fake_audio_path.open("rb") as audio_file:
                response = await client.post(
                    "/api/voices/upload",
                    headers={
                        "Authorization": f"Bearer {token}",
                    },
                    files={
                        "file": (
                            "fake.wav",
                            audio_file,
                            "audio/wav",
                        )
                    },
                )

        assert response.status_code != 201

        temporary_filename = (
            response.json().get("temporary_file")
        )

        if temporary_filename:
            temporary_path = (
                Path("storage/temp_uploads")
                / temporary_filename
            )
            assert not temporary_path.exists()

    finally:
        app.dependency_overrides.clear()