
from pwdlib import PasswordHash

# Use Argon2 via pwdlib so we avoid bcrypt backend compatibility issues entirely.
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    # Always store hashes, never plaintext passwords.
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Compare the entered password against the stored hash.
    return password_hash.verify(plain_password, hashed_password)