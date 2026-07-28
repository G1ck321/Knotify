# utils/tokens.py

from datetime import datetime, timedelta, timezone
from uuid import uuid4
from jose import jwt


def create_access_token(data: dict, secret_key: str, algorithm: str = "HS256", expires_minutes: int = 60):
    # Attach an expiry so the token cannot live forever.
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def generate_tx_ref(prefix: str = "tx") -> str:
    # Generate a server-side payment reference that is unique and not guessable.
    return f"{prefix}_{uuid4().hex}"