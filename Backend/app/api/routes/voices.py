import logging
from pathlib import Path
from uuid import UUID, uuid4
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    Request,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.upload import (
    generate_temp_filename,
    save_upload_to_temp,
    validate_extension, validate_mime_type,
)
from app.services.voice_management import (
    VoiceManagementError,
    VoiceManagementService,
)
from app.db.postgres import get_db
from app.repositories.voice_profile_repository import VoiceProfileRepository
from app.schemas.voice import (
    VoiceRegistrationResponse,
    VoiceSummaryResponse,
    VoiceDetailResponse,
)
from app.services.audio_processing import AudioProcessingService
from app.services.audio_validation import validate_readable_audio
from app.services.voice_registration import (
    VoiceRegistrationError,
    VoiceRegistrationService,
)
from app.services.voice_storage import VoiceStorageService
from app.repositories.generation_repository import GenerationRepository
from app.schemas.voice import (
    VoiceGenerationRequest,
    VoiceGenerationResponse,
)
from app.services.voice_cloning_service import (
    VoiceCloningError,
    VoiceCloningService,
)
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/voices",
    tags=["Voices"],
)

TEMP_UPLOAD_DIR = Path("storage/temp_uploads")


# Shared stateless service instances
audio_processor = AudioProcessingService()
voice_storage = VoiceStorageService()


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_voice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> dict:

    if not file.filename:
        return {
            "status": "failed",
            "message": "Filename is required.",
        }

    extension = validate_extension(file.filename)
    validate_mime_type(file.content_type)

    temp_filename = generate_temp_filename(extension)

    temp_path = TEMP_UPLOAD_DIR / temp_filename

    try:
        size_bytes = await save_upload_to_temp(
            file,
            temp_path,
        )

        audio_info = validate_readable_audio(
            temp_path,
        )

        logger.info(
            "Voice upload accepted: %s (%d bytes)",
            temp_filename,
            size_bytes,
        )

        return {
            "status": "uploaded",
            "message": "Voice sample uploaded successfully.",
            "temporary_file": temp_filename,
            "size_bytes": size_bytes,
            "audio": audio_info,
        }

    except Exception:
        temp_path.unlink(missing_ok=True)
        raise



@router.post(
    "/register",
    response_model=VoiceRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_voice(
    request: Request,
    voice_name: str = Form(...),
    temporary_file: str = Form(...),
    reference_text: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Register an already-uploaded temporary voice sample.

    The audio is NOT uploaded again.
    """

    user_id = current_user.id

    # ---------------------------------------------------------
    # 1. Validate temporary filename
    # ---------------------------------------------------------

    filename = Path(temporary_file).name

    if filename != temporary_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid temporary file.",
        )

    temp_path = TEMP_UPLOAD_DIR / filename

    # ---------------------------------------------------------
    # 2. Make sure the file exists
    # ---------------------------------------------------------

    if not temp_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporary voice upload not found.",
        )

    # ---------------------------------------------------------
    # 3. Create temporary processed-file path
    # ---------------------------------------------------------

    processed_temp_path = (
        TEMP_UPLOAD_DIR / f"{uuid4().hex}_processed.wav"
    )

    # ---------------------------------------------------------
    # 4. Create request-scoped repository/service
    # ---------------------------------------------------------

    voice_profile_repository = VoiceProfileRepository(db)

    neutts_service = request.app.state.neutts_service

    voice_registration_service = VoiceRegistrationService(
        audio_processor=audio_processor,
        voice_storage=voice_storage,
        profile_repository=voice_profile_repository,
        neutts_service=neutts_service,
    )

    try:
        # -----------------------------------------------------
        # 5. Register voice
        # -----------------------------------------------------

        profile = await voice_registration_service.register_voice(
            user_id=user_id,
            voice_name=voice_name,
            input_path=temp_path,
            processed_temp_path=processed_temp_path,
            reference_text=reference_text,
            model="neutts",
        )

        logger.info(
            "Voice registered successfully: %s for user %s",
            profile.id,
            user_id,
        )

        return profile

    except VoiceRegistrationError as exc:
        logger.exception(
            "Voice registration failed for user %s",
            user_id,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Unexpected voice registration error for user %s",
            user_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected voice registration error.",
        ) from exc

    finally:
        # Safety cleanup.
        #
        # VoiceRegistrationService already performs cleanup,
        # but keeping this here protects the API layer if an
        # unexpected error occurs outside the service.

        temp_path.unlink(missing_ok=True)
        processed_temp_path.unlink(missing_ok=True)

@router.get(
    "",
    response_model=list[VoiceSummaryResponse],
    status_code=status.HTTP_200_OK,
)
async def list_voices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all voice profiles belonging to the authenticated user.
    """

    repository = VoiceProfileRepository(db)

    voices = await repository.list_by_user(
        user_id=current_user.id,
    )

    return voices

@router.get(
    "/{voice_id}",
    response_model=VoiceDetailResponse,
    status_code=200
)
async def get_voice(
    voice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repository = VoiceProfileRepository(db)

    voice = await repository.get_by_id(
        voice_id=voice_id,
        user_id=current_user.id,
    )

    if voice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice not found.",
        )

    return voice

@router.delete(
    "/{voice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_voice(
    voice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a voice profile and all associated generated data.
    """

    voice_profile_repository = VoiceProfileRepository(db)
    generation_repository = GenerationRepository(db)

    voice_management_service = VoiceManagementService(
        voice_profile_repository=voice_profile_repository,
        generation_repository=generation_repository,
        voice_storage=voice_storage,
    )

    try:
        deleted = await voice_management_service.delete_voice(
            user_id=current_user.id,
            voice_id=voice_id,
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voice profile not found.",
            )

        logger.info(
            "Voice deleted successfully: voice=%s user=%s",
            voice_id,
            current_user.id,
        )

        return None

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Voice deletion failed: voice=%s user=%s",
            voice_id,
            current_user.id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected voice deletion error.",
        ) from exc



@router.post(
    "/{voice_id}/generate",
    response_model=VoiceGenerationResponse,
    status_code=201,
)
async def generate_voice(
    voice_id: UUID,
    request: Request,
    generation_request: VoiceGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate speech using a registered voice profile.
    """

    voice_profile_repository = VoiceProfileRepository(db)
    generation_repository = GenerationRepository(db)

    neutts_service = request.app.state.neutts_service

    voice_cloning_service = VoiceCloningService(
        voice_profile_repository=voice_profile_repository,
        generation_repository=generation_repository,
        voice_storage=voice_storage,
        neutts_service=neutts_service,
    )

    try:
        result = await voice_cloning_service.generate_speech(
            user_id=current_user.id,
            voice_id=voice_id,
            input_text=generation_request.text,
        )

        generation = result["generation"]

        logger.info(
            "Speech generated successfully: generation=%s user=%s voice=%s",
            generation.id,
            current_user.id,
            voice_id,
        )

        return generation


    except VoiceCloningError as exc:

        logger.warning(

            "Voice generation failed: user=%s voice=%s error=%s",

            current_user.id,

            voice_id,

            exc,

        )

        if str(exc) == "Voice profile not found.":
            raise HTTPException(

                status_code=status.HTTP_404_NOT_FOUND,

                detail="Voice not found.",

            ) from exc

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=str(exc),

        ) from exc

    except Exception as exc:
        logger.exception(
            "Unexpected voice generation error: user=%s voice=%s",
            current_user.id,
            voice_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected voice generation error.",
        ) from exc


@router.get(
    "/{voice_id}/generations/{generation_id}/audio",
)
async def get_generation_audio(
    voice_id: UUID,
    generation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return generated speech audio for a generation
    owned by the authenticated user.
    """

    generation_repository = GenerationRepository(db)

    # ---------------------------------------------------------
    # 1. Find generation belonging to authenticated user
    # ---------------------------------------------------------

    generation = await generation_repository.get_by_id(
        generation_id=generation_id,
        user_id=current_user.id,
    )

    if generation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found.",
        )

    # ---------------------------------------------------------
    # 2. Verify that generation belongs to requested voice
    # ---------------------------------------------------------

    if generation.voice_id != voice_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found.",
        )

    # ---------------------------------------------------------
    # 3. Build audio path from trusted IDs
    # ---------------------------------------------------------

    audio_path = voice_storage.get_generation_path(
        user_id=current_user.id,
        generation_id=generation.id,
    )

    # ---------------------------------------------------------
    # 4. Resolve and validate storage boundary
    # ---------------------------------------------------------

    storage_root = voice_storage.base_dir.resolve()
    resolved_audio_path = audio_path.resolve()

    try:
        resolved_audio_path.relative_to(storage_root)
    except ValueError:
        logger.warning(
            "Blocked unsafe audio path: user=%s generation=%s",
            current_user.id,
            generation_id,
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found.",
        )

    # ---------------------------------------------------------
    # 5. Make sure audio file exists
    # ---------------------------------------------------------

    if not resolved_audio_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found.",
        )

    # ---------------------------------------------------------
    # 6. Return audio file
    # ---------------------------------------------------------

    return FileResponse(
        path=resolved_audio_path,
        media_type="audio/wav",
        filename=f"{generation.id}.wav",
    )