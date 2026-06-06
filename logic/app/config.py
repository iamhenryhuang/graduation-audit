import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(_ROOT, ".env"))

DB_URL = (
    f"postgresql+psycopg2://"
    f"{os.getenv('DB_USER', 'admin')}:{os.getenv('DB_PASSWORD', '123456')}"
    f"@{os.getenv('DB_HOST', 'localhost')}:{int(os.getenv('DB_PORT', '5432'))}"
    f"/{os.getenv('DB_NAME', 'myapp')}"
)

engine = create_engine(
    DB_URL,
    pool_size=10,
    max_overflow=0,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)


def get_session():
    return SessionLocal()
