from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using Argon2id.

    The plaintext password must never be stored or logged.
    """
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against its stored hash.
    """
    return password_hash.verify(password, hashed_password)