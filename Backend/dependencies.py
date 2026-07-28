from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from config import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """Decode the JWT if present and return user info, or None if guest/invalid without throwing 401."""
    if not token:
        return None

    secret_key = settings.AUTH_SECRET_KEY or settings.FW_SECRET_KEY or settings.SUPABASE_KEY

    try:
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
    secret_key = settings.AUTH_SECRET_KEY or settings.FW_SECRET_KEY or settings.SUPABASE_KEY

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