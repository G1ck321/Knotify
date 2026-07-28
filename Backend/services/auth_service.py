# services/auth_service.py

from utils.security import hash_password, verify_password


def register_user(user_repo, payload):
    # Check if the email already exists before creating a new user.
    existing_user = user_repo.get_by_email(payload.email)
    if existing_user:
        raise ValueError("Email already registered")

    hashed_password = hash_password(payload.password)
    return user_repo.create_user(payload, hashed_password)


def authenticate_user(user_repo, email: str, password: str):
    # Validate credentials and return the user when the match succeeds.
    user = user_repo.get_by_email(email)
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user