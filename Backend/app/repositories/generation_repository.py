from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generation import Generation


class GenerationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
            self,
            generation_id: UUID,
            user_id: UUID,
            voice_id: UUID,
            input_text: str,
            audio_path: str,
            generation_time: float,
            model: str = "neutts",
    ) -> Generation:
        generation = Generation(
            id=generation_id,
            user_id=user_id,
            voice_id=voice_id,
            input_text=input_text,
            audio_path=audio_path,
            generation_time=generation_time,
            model=model,
        )

        self.session.add(generation)

        await self.session.commit()
        await self.session.refresh(generation)

        return generation

    async def get_by_id(
        self,
        generation_id: UUID,
        user_id: UUID,
    ) -> Generation | None:
        result = await self.session.execute(
            select(Generation).where(
                Generation.id == generation_id,
                Generation.user_id == user_id,
            )
        )

        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: UUID,
    ) -> list[Generation]:
        result = await self.session.execute(
            select(Generation)
            .where(Generation.user_id == user_id)
            .order_by(Generation.created_at)
        )

        return list(result.scalars().all())

    async def list_by_voice(
        self,
        voice_id: UUID,
        user_id: UUID,
    ) -> list[Generation]:
        result = await self.session.execute(
            select(Generation)
            .where(
                Generation.voice_id == voice_id,
                Generation.user_id == user_id,
            )
            .order_by(Generation.created_at)
        )

        return list(result.scalars().all())

    async def delete(
        self,
        generation_id: UUID,
        user_id: UUID,
    ) -> bool:
        generation = await self.get_by_id(
            generation_id=generation_id,
            user_id=user_id,
        )

        if generation is None:
            return False

        await self.session.delete(generation)
        await self.session.commit()

        return True

    async def delete_by_voice(
            self,
            voice_id: UUID,
            user_id: UUID,
    ) -> list[Generation]:
        generations = await self.list_by_voice(
            voice_id=voice_id,
            user_id=user_id,
        )

        for generation in generations:
            await self.session.delete(generation)

        return generations