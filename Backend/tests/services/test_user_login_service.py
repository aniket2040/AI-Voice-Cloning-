import pytest
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserLoginRequest
from app.security.password import hash_password
from app.services.user_login_service import (
    UserLoginError,
    UserLoginService,
)


@pytest.mark.asyncio
async def test_login_success(db_session):
    user_repository = UserRepository(db_session)

    user = await user_repository.create(
        name="Login Test User",
        email="login@example.com",
        password_hash=hash_password("password123"),
    )

    service = UserLoginService(user_repository)

    request = UserLoginRequest(
        email="login@example.com",
        password="password123",
    )

    token = await service.login(request)

    assert isinstance(token, str)
    assert token


@pytest.mark.asyncio
async def test_login_wrong_password(db_session):
    user_repository = UserRepository(db_session)

    await user_repository.create(
        name="Login Test User",
        email="login-wrong@example.com",
        password_hash=hash_password("password123"),
    )

    service = UserLoginService(user_repository)

    request = UserLoginRequest(
        email="login-wrong@example.com",
        password="wrongpassword",
    )

    with pytest.raises(
        UserLoginError,
        match="Invalid email or password.",
    ):
        await service.login(request)


@pytest.mark.asyncio
async def test_login_unknown_email(db_session):
    user_repository = UserRepository(db_session)

    service = UserLoginService(user_repository)

    request = UserLoginRequest(
        email="does-not-exist@example.com",
        password="password123",
    )

    with pytest.raises(
        UserLoginError,
        match="Invalid email or password.",
    ):
        await service.login(request)


@pytest.mark.asyncio
async def test_login_normalizes_email(db_session):
    user_repository = UserRepository(db_session)

    await user_repository.create(
        name="Normalization User",
        email="normalize@example.com",
        password_hash=hash_password("password123"),
    )

    service = UserLoginService(user_repository)

    request = UserLoginRequest(
        email="  NORMALIZE@EXAMPLE.COM  ",
        password="password123",
    )

    token = await service.login(request)

    assert isinstance(token, str)
    assert token