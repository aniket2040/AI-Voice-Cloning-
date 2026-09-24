import pytest
from httpx import ASGITransport, AsyncClient
from uuid import uuid4
from app.main import app
from app.db.postgres import get_db
from app.security.password import verify_password
from app.models.user import User
from sqlalchemy import select

@pytest.mark.asyncio
async def test_register_user(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = ASGITransport(app=app)

        email = f"test-{uuid4()}@example.com"

        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "name": "Test User",
                    "email": email,
                    "password": "password123",
                },
            )

        assert response.status_code == 201

        data = response.json()

        assert data["name"] == "Test User"
        assert data["email"] == email
        assert "id" in data
        assert "created_at" in data

        assert "password" not in data
        assert "password_hash" not in data

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_duplicate_email(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = ASGITransport(app=app)

        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            email = f"duplicate-{uuid4()}@example.com"

            first_response = await client.post(
                "/api/auth/register",
                json={
                    "name": "First User",
                    "email": email,
                    "password": "password123",
                },
            )

            assert first_response.status_code == 201

            second_response = await client.post(
                "/api/auth/register",
                json={
                    "name": "Second User",
                    "email": email,
                    "password": "password456",
                },
            )

            assert second_response.status_code == 409
            assert second_response.json()["detail"] == (
                "A user with this email already exists."
            )

        assert second_response.status_code == 409
        assert second_response.json()["detail"] == (
            "A user with this email already exists."
        )

    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_register_invalid_email():
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "not-an-email",
                "password": "password123",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password():
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "valid@example.com",
                "password": "1234567",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_missing_password():
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "valid@example.com",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_user(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = ASGITransport(app=app)

        email = f"test-{uuid4()}@example.com"

        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "name": "Test User",
                    "email": email,
                    "password": "password123",
                },
            )

        assert response.status_code == 201

        data = response.json()

        # Response contract
        assert set(data.keys()) == {
            "id",
            "name",
            "email",
            "created_at",
        }

        assert data["name"] == "Test User"
        assert data["email"] == email

        assert "password" not in data
        assert "password_hash" not in data

        # Database verification
        result = await db_session.execute(
            select(User).where(User.email == email)
        )

        user = result.scalar_one_or_none()

        assert user is not None
        assert user.name == "Test User"
        assert user.email == email

    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_register_invalid_request():
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "not-an-email",
                "password": "password123",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_test_user_fixture(create_test_user):
    user = await create_test_user()

    assert user.name == "Test User"
    assert user.email.endswith("@example.com")
    assert user.password_hash != "password123"


import logging


@pytest.mark.asyncio
async def test_register_password_not_written_to_logs(
    db_session,
    caplog,
):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    password = "SuperSecret123"
    email = f"log-test-{uuid4()}@example.com"

    try:
        transport = ASGITransport(app=app)

        with caplog.at_level(logging.DEBUG):
            async with AsyncClient(
                transport=transport,
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/auth/register",
                    json={
                        "name": "Log Security User",
                        "email": email,
                        "password": password,
                    },
                )

        assert response.status_code == 201

        # The plaintext password must never appear in application logs.
        assert password not in caplog.text

    finally:
        app.dependency_overrides.clear()