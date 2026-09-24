import pytest
from httpx import ASGITransport, AsyncClient
from uuid import uuid4

from app.db.postgres import get_db
from app.main import app
from app.repositories.user_repository import UserRepository
from app.security.jwt import create_access_token
from app.security.password import hash_password


@pytest.mark.asyncio
async def test_get_me_success(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    email = f"me-{uuid4()}@example.com"
    password = "password123"

    try:
        user_repository = UserRepository(db_session)

        user = await user_repository.create(
            name="Me Test User",
            email=email,
            password_hash=hash_password(password),
        )

        token = create_access_token(user.id)

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/auth/me",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

        assert response.status_code == 200

        data = response.json()

        assert data["id"] == str(user.id)
        assert data["name"] == "Me Test User"
        assert data["email"] == email
        assert "created_at" in data

        assert "password_hash" not in data
        assert "password" not in data

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_me_without_token(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/auth/me",
            )

        assert response.status_code == 401

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_me_with_invalid_token(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/auth/me",
                headers={
                    "Authorization": "Bearer invalid-token",
                },
            )

        assert response.status_code == 401

    finally:
        app.dependency_overrides.clear()