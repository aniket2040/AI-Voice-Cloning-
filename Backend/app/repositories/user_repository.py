from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, name: str) -> User:
        user = User(name=name)

        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        return user

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )

        return result.scalar_one_or_none()

    async def list_all(self) -> list[User]:
        result = await self.session.execute(
            select(User).order_by(User.created_at)
        )

        return list(result.scalars().all())

    async def update_name(
        self,
        user_id: UUID,
        name: str,
    ) -> User | None:
        user = await self.get_by_id(user_id)

        if user is None:
            return None

        user.name = name

        await self.session.commit()
        await self.session.refresh(user)

        return user

    async def delete(self, user_id: UUID) -> bool:
        user = await self.get_by_id(user_id)

        if user is None:
            return False

        await self.session.delete(user)
        await self.session.commit()

        return True