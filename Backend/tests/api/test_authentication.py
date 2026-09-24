from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.security.jwt import create_access_token
from app.security.password import hash_password


@pytest.mark.asyncio
async def test_get_current_user_valid_token(db_session):
    repository = UserRepository(db_session)

    user = await repository.create(
        name="Auth Test User",
        email=f"auth-test-{uuid4()}@example.com",
        password_hash=hash_password("password123"),
    )

    token = create_access_token(user.id)

    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token,
    )

    result = await get_current_user(
        credentials=credentials,
        db=db_session,
    )

    assert result.id == user.id
    assert result.email == user.email


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(db_session):
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="invalid.token.value",
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(
            credentials=credentials,
            db=db_session,
        )

    assert exc_info.value.status_code == 401
    assert exc_info.value.headers["WWW-Authenticate"] == "Bearer"


@pytest.mark.asyncio
async def test_get_current_user_deleted_user(db_session):
    user_id = __import__("uuid").uuid4()

    token = create_access_token(user_id)

    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token,
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(
            credentials=credentials,
            db=db_session,
        )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "User no longer exists."