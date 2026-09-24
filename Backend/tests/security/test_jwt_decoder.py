from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from app.config import settings
from app.security.jwt import (
    create_access_token,
    decode_access_token,
)


def test_decode_valid_access_token():
    user_id = uuid4()

    token = create_access_token(user_id)

    decoded_user_id = decode_access_token(token)

    assert decoded_user_id == user_id


def test_decode_invalid_token():
    with pytest.raises(InvalidTokenError):
        decode_access_token("invalid.token.value")


def test_decode_expired_token():
    user_id = uuid4()

    expired_time = datetime.now(timezone.utc) - timedelta(
        minutes=1
    )

    payload = {
        "sub": str(user_id),
        "iat": expired_time - timedelta(minutes=1),
        "exp": expired_time,
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    with pytest.raises(ExpiredSignatureError):
        decode_access_token(token)


def test_decode_token_without_user_id():
    payload = {
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=30),
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    with pytest.raises(InvalidTokenError):
        decode_access_token(token)


def test_decode_token_with_invalid_user_id():
    payload = {
        "sub": "not-a-valid-uuid",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=30),
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    with pytest.raises(InvalidTokenError):
        decode_access_token(token)