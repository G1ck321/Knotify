from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from config import auth_secret, settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def require_auth_secret() -> str:
    """The dedicated JWT signing key, or a generic 500 if the server is misconfigured.

    MUST NOT fall back to FW_SECRET_KEY or SUPABASE_KEY: whoever holds the
    payment key or the database service-role key could then mint valid
    sessions for any user, turning a single leaked key into total auth bypass.
    main.py refuses to boot without the key, so reaching this 500 means
    something bypassed startup validation.
    """
    secret_key = auth_secret()
    if not secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication is not configured on this server.",
        )
    return secret_key


def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """Decode the JWT if present and return user info, or None if guest/invalid without throwing 401."""
    if not token:
        return None

    try:
        # Guest-tolerant: a misconfigured server yields None (public view)
        # instead of an error on routes that only optionally need a user.
        secret_key = require_auth_secret()
        payload = jwt.decode(token, secret_key, algorithms=[settings.AUTH_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None

        return {
            "id": user_id,
            "email": payload.get("email"),
            "name": payload.get("name"),
        }
    except Exception:
        return None


def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login"))):
    """Strict authenticated user dependency for protected routes requiring valid login."""
    secret_key = require_auth_secret()

    try:
        payload = jwt.decode(token, secret_key, algorithms=[settings.AUTH_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        return {
            "id": user_id,
            "email": payload.get("email"),
            "name": payload.get("name"),
        }
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials") from exc