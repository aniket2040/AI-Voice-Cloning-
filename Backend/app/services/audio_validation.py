from pathlib import Path

import soundfile as sf
from fastapi import HTTPException, status


def validate_readable_audio(file_path: Path) -> dict:
    try:
        info = sf.info(str(file_path))

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file could not be read as valid audio.",
        ) from exc

    if info.frames <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Audio file contains no audio frames.",
        )

    if info.samplerate <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Audio file has an invalid sample rate.",
        )

    if info.channels <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Audio file has no valid audio channels.",
        )

    return {
        "format": info.format,
        "subtype": info.subtype,
        "sample_rate": info.samplerate,
        "channels": info.channels,
        "frames": info.frames,
        "duration_seconds": info.frames / info.samplerate,
    }