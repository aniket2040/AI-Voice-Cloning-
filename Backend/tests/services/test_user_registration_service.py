import pytest

from app.models.user import User
from app.schemas.user import UserRegistrationRequest
from app.services.user_registration_service import (
    UserRegistrationError,
    UserRegistrationService,
)
from app.security.password import verify_password


class FakeUserRepository:
    def __init__(self):
        self.users: list[User] = []

    async def get_by_email(self, email: str):
        return next(
            (user for user in self.users if user.email == email),
            None,
        )

    async def create(
        self,
        name: str,
        email: str,
        password_hash: str,
    ):
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
        )

        self.users.append(user)

        return user


@pytest.mark.asyncio
async def test_register_user():
    repository = FakeUserRepository()

    service = UserRegistrationService(repository)

    request = UserRegistrationRequest(
        name="Aniket",
        email="aniket@example.com",
        password="secure-password",
    )

    user = await service.register(request)

    assert user.name == "Aniket"
    assert user.email == "aniket@example.com"

    assert user.password_hash != "secure-password"

    assert verify_password(
        "secure-password",
        user.password_hash,
    )


@pytest.mark.asyncio
async def test_duplicate_email_is_rejected():
    repository = FakeUserRepository()

    service = UserRegistrationService(repository)

    first_request = UserRegistrationRequest(
        name="Aniket",
        email="aniket@example.com",
        password="secure-password",
    )

    await service.register(first_request)

    second_request = UserRegistrationRequest(
        name="Another User",
        email="aniket@example.com",
        password="another-password",
    )

    with pytest.raises(UserRegistrationError):
        await service.register(second_request)

    assert len(repository.users) == 1


@pytest.mark.asyncio
async def test_email_is_normalized():
    repository = FakeUserRepository()

    service = UserRegistrationService(repository)

    request = UserRegistrationRequest(
        name="  Aniket  ",
        email="  Aniket@Example.com  ",
        password="secure-password",
    )

    user = await service.register(request)

    assert user.name == "Aniket"
    assert user.email == "aniket@example.com"


@pytest.mark.asyncio
async def test_password_is_never_stored_as_plaintext():
    repository = FakeUserRepository()

    service = UserRegistrationService(repository)

    request = UserRegistrationRequest(
        name="Aniket",
        email="aniket@example.com",
        password="secure-password",
    )

    user = await service.register(request)

    assert user.password_hash != request.password

    assert verify_password(
        request.password,
        user.password_hash,
    )