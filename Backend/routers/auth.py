from uuid import uuid4
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from config import settings
from database import supabase
from services.auth_service import authenticate_user, register_user
from utils.tokens import create_access_token


# Keep auth in its own router so signup and login stay separated from payment code.
router = APIRouter(prefix="/api/auth", tags=["Auth"])


class UserRecord:
    """Lightweight wrapper around a Supabase row so service code can use attribute access."""

    def __init__(self, data: dict):
        self._data = data

    def __getattr__(self, item):
        try:
            return self._data[item]
        except KeyError as exc:
            raise AttributeError(item) from exc

    def to_public_dict(self):
        # Never send password hashes back to the client.
        public_user = dict(self._data)
        public_user.pop("password_hash", None)
        return public_user


class SupabaseUserRepository:
    """Minimal repository adapter so auth service code stays database-agnostic."""

    def __init__(self, client):
        self.client = client

    def get_by_email(self, email: str):
        response = (
            self.client.table("users")
            .select("*")
            .eq("email", email.strip().lower())
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            return None
        return UserRecord(rows[0])

    def create_user(self, payload, hashed_password: str):
        # Map the frontend's telegram phone into the backend's primary phone column.
        user_row = {
            "id": str(uuid4()),
            "full_name": payload.name.strip(),
            "email": payload.email.strip().lower(),
            "phone": payload.telegramPhone.strip(),
            "password_hash": hashed_password,
            "parentsNumber":payload.parentsNumber.strip(),
            "telegramPhone":payload.telegramPhone.strip(),
            "whatsApp":payload.whatsApp.strip(),
            "is_active": True
        }

        response = self.client.table("users").insert(user_row).execute()
        rows = response.data or [user_row]
        return UserRecord(rows[0])


def _user_repo() -> SupabaseUserRepository:
    # Keep repository construction in one place so the handlers stay short.
    return SupabaseUserRepository(supabase)


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    telegramPhone: str = Field(..., min_length=7)
    parentsNumber: str = Field(..., min_length=7)
    whatsApp: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    """Create a new student account and persist only the fields the backend stores."""

    repository = _user_repo()

    # Reject duplicate emails early so we can return a clear 409 instead of a generic DB error.
    if repository.get_by_email(payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    try:
        user = register_user(repository, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return {
        "message": "Account created",
        "user": user.to_public_dict(),
    }


@router.post("/login")
async def login(payload: LoginRequest):
    """Validate credentials and return a signed access token for protected routes."""

    repository = _user_repo()
    user = authenticate_user(repository, payload.email, payload.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    secret_key = settings.AUTH_SECRET_KEY or settings.FW_SECRET_KEY or settings.SUPABASE_KEY
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "name": user.full_name},
        secret_key=secret_key,
        algorithm=settings.AUTH_ALGORITHM,
        expires_minutes=settings.AUTH_TOKEN_EXPIRES_MINUTES,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_public_dict(),
    }