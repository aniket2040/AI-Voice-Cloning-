from uuid import uuid4

import pytest_asyncio
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config import settings
from app.repositories.user_repository import UserRepository
from app.security.password import hash_password


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    test_engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        poolclass=NullPool,
    )

    TestSessionLocal = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.rollback()

    await test_engine.dispose()


@pytest_asyncio.fixture
async def create_test_user(db_session):
    async def _create_test_user(
        name: str = "Test User",
        email: str | None = None,
        password: str = "password123",
    ):
        if email is None:
            email = f"test-{uuid4()}@example.com"

        repository = UserRepository(db_session)

        return await repository.create(
            name=name,
            email=email,
            password_hash=hash_password(password),
        )

    return _create_test_user