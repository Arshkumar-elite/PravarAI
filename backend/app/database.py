from pathlib import Path

from sqlalchemy import event
from sqlalchemy.engine import make_url
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings


def make_engine(url: str):
    database = make_url(url).database
    if database and database != ":memory:":
        Path(database).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(url, connect_args={"check_same_thread": False, "timeout": 15})

    @event.listens_for(engine, "connect")
    def configure_sqlite(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")

    return engine


engine = make_engine(settings.database_url)


def create_tables(db_engine=engine):
    SQLModel.metadata.create_all(db_engine)


def get_session():
    with Session(engine) as session:
        yield session
