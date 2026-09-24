from datetime import datetime, timezone
from uuid import uuid4

import jwt

from app.config import settings
from app.security.jwt import create_access_token


def test_create_access_token():
    user_id = uuid4()

    token = create_access_token(user_id)

    assert isinstance(token, str)
    assert token


def test_access_token_contains_user_id():
    user_id = uuid4()

    token = create_access_token(user_id)

    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )

    assert payload["sub"] == str(user_id)


def test_access_token_contains_expiration():
    user_id = uuid4()

    token = create_access_token(user_id)

    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )

    assert "exp" in payload
    assert "iat" in payload


def test_access_token_has_future_expiration():
    user_id = uuid4()

    token = create_access_token(user_id)

    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )

    expiration = datetime.fromtimestamp(
        payload["exp"],
        tz=timezone.utc,
    )

    assert expiration > datetime.now(timezone.utc)