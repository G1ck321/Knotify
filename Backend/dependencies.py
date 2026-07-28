from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from config import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    # Decode the JWT and return the authenticated user payload.
    # Raise 401 if the token is missing, invalid, or expired.
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