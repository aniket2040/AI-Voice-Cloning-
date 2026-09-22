from uuid import uuid4

from app.models.generation import Generation
from app.models.user import User
from app.models.voice_profile import VoiceProfile, VoiceStatus


def test_user_voice_relationship():
    user = User(name="Test User")

    voice = VoiceProfile(
        name="My Voice",
        processed_audio_path="storage/processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    user.voice_profiles.append(voice)

    assert voice.user is user
    assert voice in user.voice_profiles


def test_user_generation_relationship():
    user = User(name="Test User")

    generation = Generation(
        input_text="Hello world",
        audio_path="storage/generation.wav",
        model="neutts",
        generation_time=2.5,
    )

    user.generations.append(generation)

    assert generation.user is user
    assert generation in user.generations


def test_voice_generation_relationship():
    voice = VoiceProfile(
        name="My Voice",
        processed_audio_path="storage/processed.wav",
        status=VoiceStatus.READY,
        model="neutts",
    )

    generation = Generation(
        input_text="Hello world",
        audio_path="storage/generation.wav",
        model="neutts",
        generation_time=2.5,
    )

    voice.generations.append(generation)

    assert generation.voice is voice
    assert generation in voice.generations