from pathlib import Path
from unittest.mock import Mock, patch

from app.services.neutts_service import NeuTTSService


def test_encode_reference():
    fake_codes = Mock()

    with patch(
        "app.services.neutts_service.NeuTTS"
    ) as mock_neutts:

        mock_instance = mock_neutts.return_value
        mock_instance.encode_reference.return_value = fake_codes

        service = NeuTTSService()

        audio_path = Path("processed.wav")

        result = service.encode_reference(audio_path)

        mock_instance.encode_reference.assert_called_once_with(
            str(audio_path)
        )

        assert result is fake_codes