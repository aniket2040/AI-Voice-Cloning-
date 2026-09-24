from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status


MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25 MB
CHUNK_SIZE = 1024 * 1024  # 1 MB

ALLOWED_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".flac",
    ".ogg",
    ".m4a",
}

ALLOWED_MIME_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/flac",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
}

def validate_mime_type(content_type: str | None) -> str:
    if not content_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Audio content type is required.",
        )

    content_type = content_type.lower().strip()

    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported audio content type.",
        )

    return content_type


def validate_extension(filename: str) -> str:
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "Unsupported audio format. "
                "Allowed formats: .wav, .mp3, .flac, .ogg, .m4a"
            ),
        )

    return extension


def generate_temp_filename(extension: str) -> str:
    return f"{uuid4().hex}{extension}"


async def save_upload_to_temp(
    upload: UploadFile,
    destination: Path,
) -> int:

    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    total_size = 0

    try:
        with destination.open("wb") as output:

            while chunk := await upload.read(CHUNK_SIZE):

                total_size += len(chunk)

                if total_size > MAX_UPLOAD_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Audio file exceeds the 25 MB upload limit.",
                    )

                output.write(chunk)

    except HTTPException:
        destination.unlink(missing_ok=True)
        raise

    except Exception:
        destination.unlink(missing_ok=True)
        raise

    finally:
        await upload.close()

    if total_size == 0:
        destination.unlink(missing_ok=True)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty.",
        )

    return total_size