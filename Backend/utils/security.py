
from passlib.context import CryptContext

# Configure a single password hasher for the whole project.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_BCRYPT_PASSWORD_BYTES = 72


def _ensure_bcrypt_safe_password(password: str) -> None:
    # Bcrypt only accepts up to 72 bytes, so reject anything longer before hashing.
    if len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError("Password cannot be longer than 72 bytes")


def hash_password(password: str) -> str:
    # Always store hashes, never plaintext passwords.
    _ensure_bcrypt_safe_password(password)
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Compare the entered password against the stored hash.
    return pwd_context.verify(plain_password, hashed_password)