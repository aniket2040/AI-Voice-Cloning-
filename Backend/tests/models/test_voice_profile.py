from uuid import uuid4

from app.db.base import Base
from app.models.voice_profile import VoiceProfile, VoiceStatus


def test_voice_profile_model():
    user_id = uuid4()

    voice = VoiceProfile(
        user_id=user_id,
        name="My Voice",
        processed_audio_path=(
            "storage/users/user_123/voices/voice_123/processed.wav"
        ),
        status=VoiceStatus.READY,
        model="neutts",
    )

    assert voice.name == "My Voice"
    assert voice.user_id == user_id
    assert voice.status == VoiceStatus.READY
    assert voice.model == "neutts"


def test_voice_profile_table_registered():
    assert "voice_profiles" in Base.metadata.tables


def test_voice_profile_has_user_foreign_key():
    table = Base.metadata.tables["voice_profiles"]

    foreign_keys = {
        foreign_key.target_fullname
        for foreign_key in table.foreign_keys
    }

    assert "users.id" in foreign_keys