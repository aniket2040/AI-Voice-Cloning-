from uuid import uuid4

from app.db.base import Base
from app.models.generation import Generation


def test_generation_model():
    user_id = uuid4()
    voice_id = uuid4()

    generation = Generation(
        user_id=user_id,
        voice_id=voice_id,
        input_text="Hello, welcome to my application.",
        audio_path=(
            "storage/users/user_123/generations/gen_001.wav"
        ),
        model="neutts",
        generation_time=2.41,
    )

    assert generation.user_id == user_id
    assert generation.voice_id == voice_id
    assert generation.input_text == (
        "Hello, welcome to my application."
    )
    assert generation.model == "neutts"
    assert generation.generation_time == 2.41


def test_generation_table_registered():
    assert "generations" in Base.metadata.tables


def test_generation_has_foreign_keys():
    table = Base.metadata.tables["generations"]

    foreign_keys = {
        foreign_key.target_fullname
        for foreign_key in table.foreign_keys
    }

    assert "users.id" in foreign_keys
    assert "voice_profiles.id" in foreign_keys