from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models.base import Base


# Local Postgres engine/session helper, similar in spirit to Flask's SQLAlchemy config.
if not settings.DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required to use the local Postgres database layer")

engine = create_engine(settings.DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    # FastAPI dependency that yields one database session per request.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    # Call this once during local development if you want SQLAlchemy to create the tables.
    Base.metadata.create_all(bind=engine)
