from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegistrationRequest
from app.security.password import hash_password


class UserRegistrationError(Exception):
    """Raised when user registration fails."""


class UserRegistrationService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def register(
        self,
        request: UserRegistrationRequest,
    ):
        email = request.email.lower().strip()

        existing_user = await self.user_repository.get_by_email(email)

        if existing_user is not None:
            raise UserRegistrationError(
                "A user with this email already exists."
            )

        password_hash = hash_password(request.password)

        user = await self.user_repository.create(
            name=request.name.strip(),
            email=email,
            password_hash=password_hash,
        )

        return user