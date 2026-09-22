from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.voice_profile import VoiceProfile, VoiceStatus


class VoiceProfileRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: UUID,
        name: str,
        processed_audio_path: str,
        status: VoiceStatus = VoiceStatus.UPLOADED,
        model: str = "neutts",
    ) -> VoiceProfile:
        voice = VoiceProfile(
            user_id=user_id,
            name=name,
            processed_audio_path=processed_audio_path,
            status=status,
            model=model,
        )

        self.session.add(voice)
        await self.session.commit()
        await self.session.refresh(voice)

        return voice

    async def get_by_id(
        self,
        voice_id: UUID,
        user_id: UUID,
    ) -> VoiceProfile | None:
        result = await self.session.execute(
            select(VoiceProfile).where(
                VoiceProfile.id == voice_id,
                VoiceProfile.user_id == user_id,
            )
        )

        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: UUID,
    ) -> list[VoiceProfile]:
        result = await self.session.execute(
            select(VoiceProfile)
            .where(VoiceProfile.user_id == user_id)
            .order_by(VoiceProfile.created_at)
        )

        return list(result.scalars().all())

    async def list_ready_by_user(
        self,
        user_id: UUID,
    ) -> list[VoiceProfile]:
        result = await self.session.execute(
            select(VoiceProfile)
            .where(
                VoiceProfile.user_id == user_id,
                VoiceProfile.status == VoiceStatus.READY,
            )
            .order_by(VoiceProfile.created_at)
        )

        return list(result.scalars().all())

    async def update_status(
        self,
        voice_id: UUID,
        user_id: UUID,
        status: VoiceStatus,
    ) -> VoiceProfile | None:
        voice = await self.get_by_id(
            voice_id=voice_id,
            user_id=user_id,
        )

        if voice is None:
            return None

        voice.status = status

        await self.session.commit()
        await self.session.refresh(voice)

        return voice

    async def delete(
        self,
        voice_id: UUID,
        user_id: UUID,
    ) -> bool:
        voice = await self.get_by_id(
            voice_id=voice_id,
            user_id=user_id,
        )

        if voice is None:
            return False

        await self.session.delete(voice)
        await self.session.commit()

        return True

    async def update_audio_path(
            self,
            voice_id: UUID,
            user_id: UUID,
            processed_audio_path: str,
    ) -> VoiceProfile | None:
        voice = await self.get_by_id(
            voice_id=voice_id,
            user_id=user_id,
        )

        if voice is None:
            return None

        voice.processed_audio_path = processed_audio_path

        await self.session.commit()
        await self.session.refresh(voice)

        return voice

    async def update_reference_data(
            self,
            voice_id: UUID,
            user_id: UUID,
            reference_codes_path: str,
            reference_text: str,
    ) -> VoiceProfile | None:
        voice = await self.get_by_id(
            voice_id=voice_id,
            user_id=user_id,
        )

        if voice is None:
            return None

        voice.reference_codes_path = reference_codes_path
        voice.reference_text = reference_text

        await self.session.commit()
        await self.session.refresh(voice)

        return voice