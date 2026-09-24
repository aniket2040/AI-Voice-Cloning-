import pytest
import jwt
from httpx import ASGITransport, AsyncClient
from uuid import uuid4

from app.config import settings
from app.db.postgres import get_db
from app.main import app
from app.repositories.user_repository import UserRepository
from app.security.password import hash_password


@pytest.mark.asyncio
async def test_login_success(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    email = f"login-{uuid4()}@example.com"
    password = "password123"

    try:
        user_repository = UserRepository(db_session)

        await user_repository.create(
            name="Login Test User",
            email=email,
            password_hash=hash_password(password),
        )

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/auth/login",
                json={
                    "email": email,
                    "password": password,
                },
            )

        assert response.status_code == 200

        data = response.json()

        assert "access_token" in data
        assert data["access_token"]
        assert data["token_type"] == "bearer"

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_token_contains_user_identity(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    email = f"token-{uuid4()}@example.com"
    password = "password123"

    try:
        user_repository = UserRepository(db_session)

        user = await user_repository.create(
            name="Token Test User",
            email=email,
            password_hash=hash_password(password),
        )

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/auth/login",
                json={
                    "email": email,
                    "password": password,
                },
            )

        assert response.status_code == 200

        token = response.json()["access_token"]

        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        assert payload["sub"] == str(user.id)
        assert "iat" in payload
        assert "exp" in payload

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_wrong_password(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    email = f"wrong-password-{uuid4()}@example.com"

    try:
        user_repository = UserRepository(db_session)

        await user_repository.create(
            name="Wrong Password User",
            email=email,
            password_hash=hash_password("password123"),
        )

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/auth/login",
                json={
                    "email": email,
                    "password": "wrongpassword",
                },
            )

        assert response.status_code == 401
        assert response.json()["detail"] == (
            "Invalid email or password."
        )

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_unknown_email(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/auth/login",
                json={
                    "email": f"unknown-{uuid4()}@example.com",
                    "password": "password123",
                },
            )

        assert response.status_code == 401
        assert response.json()["detail"] == (
            "Invalid email or password."
        )

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_invalid_email():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "not-an-email",
                "password": "password123",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_missing_password():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "valid@example.com",
            },
        )

    assert response.status_code == 422