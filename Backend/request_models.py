"""Request models for auth and checkout payloads.

This file is intentionally separate from the legacy schemas.py file so the new
normalized request shape can be adopted without breaking the existing code path
all at once.
"""

import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class OrderItemInput(BaseModel):
    """One purchasable line item in a checkout request."""

    item_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    image_url: Optional[str] = None

    @field_validator("image_url", mode="before")
    @classmethod
    def normalize_optional_image_url(cls, value):
        # Let the frontend omit the image for items that do not have one.
        if value in (None, ""):
            return None
        return str(value).strip()


class CheckoutRequest(BaseModel):
    """Normalized checkout payload for one payment session."""

    name: str = Field(..., min_length=1)
    telegramPhone: str
    matricNumber: Optional[str] = None
    address: str
    email: str
    roomNumber: str
    items: list[OrderItemInput] = Field(default_factory=list, min_length=1)
    order_details: Optional[str] = None
    amount: float = Field(..., gt=0)
    status:str


    @field_validator("items", mode="before")
    @classmethod
    def ensure_items_list(cls, value):
        # Accept a single item object from older frontend code and normalize it.
        if value in (None, ""):
            return []
        if isinstance(value, dict):
            return [value]
        return value

    @field_validator("orderDetails", mode="before")
    @classmethod
    def normalize_order_details(cls, value):
        # Keep a readable snapshot field for receipts and webhook payloads.
        if value in (None, ""):
            return None
        return str(value).strip()

    @field_validator("matricNumber", mode="before")
    @classmethod
    def validate_matric_number(cls, value):
        # Normalize optional matric values so the database gets a stable format.
        if value in (None, ""):
            return None
        if not isinstance(value, str):
            raise ValueError("matricNumber must be a string")

        normalized_value = value.strip().upper()
        if not re.fullmatch(r"\d{2}[A-Z]{2}\d{6}", normalized_value):
            raise ValueError("matricNumber must match the format 12AB345678")

        return normalized_value

    @property
    def order_summary(self) -> str:
        """Build a human-readable order summary from the normalized line items."""
        if self.orderDetails:
            return self.orderDetails
        if not self.items:
            return ""

        return ", ".join(f"{item.quantity} x {item.name}" for item in self.items)

    @property
    def items_total(self) -> float:
        """Compute the subtotal from the normalized line items."""
        return sum(item.quantity * item.unit_price for item in self.items)


class OrderCreateRequest(CheckoutRequest):
    """Explicit local-Postgres order schema name for the normalized checkout payload."""


class UserCreateRequest(BaseModel):
    """Local-Postgres user schema matching the normalized users table."""

    full_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=1)
    password: str = Field(..., min_length=8)


class UserLoginRequest(BaseModel):
    """Local-Postgres login schema."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class SignupRequest(BaseModel):
    """Signup payload for account creation."""

    full_name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=1)
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    """Login payload for authentication."""

    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
