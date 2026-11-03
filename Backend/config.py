import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Typed environment settings loaded from local .env file"""

    # Supabase connection details used by the database client.
    SUPABASE_URL: str
    #This is the service role key, it can bypass RLS, should never be given to the frontend/client
    SUPABASE_KEY: str

    # Local PostgreSQL connection string, used when you switch the app off Supabase.
    # Example: postgresql+psycopg://postgres:password@localhost:5432/knotify
    DATABASE_URL: str = ""

    # Flutterwave configuration for payment creation and webhook verification.
    FLW_SECRET_HASH: str = ""
    FW_SECRET_KEY: str = ""

    # Dedicated JWT signing key (MUST-FIX: never share it with anything else).
    # It must NOT default to FW_SECRET_KEY or SUPABASE_KEY: anyone holding the
    # payment key or the database service-role key would otherwise be able to
    # mint valid sessions for any user. main.py refuses to boot without it.
    AUTH_SECRET_KEY: str | None = None
    AUTH_ALGORITHM: str = "HS256"
    AUTH_TOKEN_EXPIRES_MINUTES: int = 60

    # Telegram and email settings for admin notifications.
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    # Public bot handle (no @) used to build the t.me deep link that the
    # "Request knotted pic" button opens. Never a secret.
    TELEGRAM_BOT_USERNAME: str = ""
    # Shared secret from setWebhook(secret_token=...). Telegram echoes it in
    # X-Telegram-Bot-Api-Secret-Token on every update, so the /webhook/telegram
    # endpoint can reject anyone else who finds its URL.
    TELEGRAM_WEBHOOK_SECRET: str = ""
    # RESEND_API_KEY: str
    @field_validator("FW_SECRET_KEY", mode="before")
    @classmethod
    def clean_fw_key(cls, v: str) -> str:
        if not isinstance(v, str):
            return ""
        v = v.strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        return v.strip()

    @field_validator("TELEGRAM_BOT_TOKEN", mode="before")
    @classmethod
    def clean_telegram_token(cls, v:str)->str:
        if not isinstance(v, str):
            return v
        v = v.strip()
        # Allow values copied from shells or editors that wrap the token in quotes.
        if (v.startswith('"') and v.endswith('"') or v.startswith("'") or v.endswith("'")):
            v = v[1:-1]
        v.strip()

        # Telegram sometimes gets pasted with the "bot" prefix included.
        if v.lower().startswith("bot"):
            v = v[3:]
        return v.strip()

    @field_validator("TELEGRAM_CHAT_ID", mode="before")
    @classmethod
    def clean_chat_id(cls, v: str) -> str:
        if not isinstance(v, str):
            return str(v)
        v = v.strip()
        # Keep chat IDs clean even if they were copied with surrounding quotes.
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        return v.strip()

    #Load variables from the project-local .env file or Backend subdirectory
    model_config = SettingsConfigDict(env_file=(".env", "Backend/.env"), env_file_encoding="utf-8")

def auth_secret() -> str:
    """Return the dedicated JWT signing key, trimmed, or ``""`` when unset.

    The only correct value is a random key written for this app alone — see
    ``main.py`` for the startup check that refuses to run without one.
    """
    return (settings.AUTH_SECRET_KEY or "").strip()


#create one shared settings instance so every module reads he configuration
settings = Settings()