from pathlib import Path

from neutts import NeuTTS


class NeuTTSService:
    def __init__(
        self,
        backbone_repo: str = "neuphonic/neutts-nano-q4-gguf",
        backbone_device: str = "cpu",
        codec_repo: str = "neuphonic/neucodec",
        codec_device: str = "cpu",
    ):
        self.tts = NeuTTS(
            backbone_repo=backbone_repo,
            backbone_device=backbone_device,
            codec_repo=codec_repo,
            codec_device=codec_device,
        )

    def encode_reference(self, audio_path: str | Path):
        return self.tts.encode_reference(str(audio_path))

    def infer(
        self,
        input_text: str,
        reference_codes,
        reference_text: str,
    ):
        return self.tts.infer(
            input_text,
            reference_codes,
            reference_text,
        )