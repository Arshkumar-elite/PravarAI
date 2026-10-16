import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel

from app.database import get_session, make_engine
from app.main import app


@pytest.fixture
def db_engine(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path / 'test.db'}")
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client(db_engine):
    def override_session():
        with Session(db_engine) as session:
            yield session

    app.app.dependency_overrides[get_session] = override_session
    # No lifespan: fixtures create the isolated schema, never the user's database.
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.app.dependency_overrides.clear()
