from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from jwt.exceptions import InvalidTokenError

from app.config import settings


def create_access_token(user_id: UUID) -> str:
    """
    Create a JWT access token for the authenticated user.
    """

    now = datetime.now(timezone.utc)

    expires_at = now + timedelta(
        minutes=settings.jwt_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> UUID:
    """
    Decode and validate a JWT access token.

    Returns:
        UUID: Authenticated user's ID.

    Raises:
        InvalidTokenError: If the token is invalid or expired.
    """

    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )

    subject = payload.get("sub")

    if not subject:
        raise InvalidTokenError(
            "Token does not contain a user ID."
        )

    try:
        return UUID(subject)
    except ValueError as exc:
        raise InvalidTokenError(
            "Token contains an invalid user ID."
        ) from exc