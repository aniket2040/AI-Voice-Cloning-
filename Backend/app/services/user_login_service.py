from app.repositories.user_repository import UserRepository
from app.schemas.user import UserLoginRequest
from app.security.jwt import create_access_token
from app.security.password import verify_password


class UserLoginError(Exception):
    """Raised when user login fails."""


class UserLoginService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def login(
        self,
        request: UserLoginRequest,
    ) -> str:
        email = request.email.lower().strip()

        user = await self.user_repository.get_by_email(email)

        if user is None:
            raise UserLoginError(
                "Invalid email or password."
            )

        if not verify_password(
            request.password,
            user.password_hash,
        ):
            raise UserLoginError(
                "Invalid email or password."
            )

        return create_access_token(user.id)