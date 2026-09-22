import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings


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