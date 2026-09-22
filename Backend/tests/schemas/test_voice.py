from datetime import datetime
from uuid import uuid4

from app.models.voice_profile import VoiceStatus
from app.schemas.voice import VoiceRegistrationResponse


def test_voice_registration_response():
    now = datetime.now()

    voice_id = uuid4()
    user_id = uuid4()

    response = VoiceRegistrationResponse(
        id=voice_id,
        user_id=user_id,
        name="My Voice",
        processed_audio_path=(
            "storage/users/"
            f"{user_id}/voices/"
            f"{voice_id}/processed.wav"
        ),
        status=VoiceStatus.READY,
        model="neutts",
        created_at=now,
        updated_at=now,
    )

    assert response.id == voice_id
    assert response.user_id == user_id
    assert response.name == "My Voice"
    assert response.status == VoiceStatus.READY
    assert response.model == "neutts"
    assert response.processed_audio_path.endswith(
        "/processed.wav"
    )