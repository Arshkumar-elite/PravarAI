from datetime import UTC, datetime

import pytest
from sqlalchemy import event
from sqlmodel import Session, func, select

from app.models import Discussion, Lead, LeadStatus
from app.schemas import DiscussionCreate
from app.seed import seed
from app.services import add_discussion


def create(client, **kwargs):
    response = client.post("/api/leads", json={"name": "  Ada Lovelace  ", **kwargs})
    assert response.status_code == 201
    return response.json()


def test_create_defaults_and_persistence(client, db_engine):
    lead = create(client, company="Analytical Engines", phone="+44 (0) 20 1234")
    assert lead["name"] == "Ada Lovelace"
    assert lead["status"] == "New"
    assert lead["last_note"] is None
    assert lead["created_at"].endswith("Z")
    with Session(db_engine) as session:
        saved = session.get(Lead, lead["id"])
        assert saved.company == "Analytical Engines"
        assert saved.phone == "+44 (0) 20 1234"
    assert client.get("/api/health").json() == {"status": "ok"}


@pytest.mark.parametrize(
    "payload", [{"name": " "}, {"name": "x" * 121}, {}, {"name": "Ada", "status": "Won"}]
)
def test_invalid_lead(client, payload):
    assert client.post("/api/leads", json=payload).status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {"note": " "},
        {"note": "x" * 5001},
        {"note": "Hello", "follow_up_at": "2026-10-16T10:00:00"},
        {"note": "Hello", "follow_up_at": "bad"},
    ],
)
def test_invalid_discussion(client, payload):
    lead = create(client)
    assert client.post(f"/api/leads/{lead['id']}/discussions", json=payload).status_code == 422


def test_discussions_follow_up_and_status(client, db_engine):
    lead = create(client)
    url = f"/api/leads/{lead['id']}"
    result = client.post(
        url + "/discussions",
        json={
            "note": "  Discussed the proposal.  ",
            "follow_up_at": "2026-10-16T14:30:00+05:30",
        },
    )
    assert result.status_code == 201
    assert result.json()["lead"]["follow_up_at"] == "2026-10-16T09:00:00Z"
    assert result.json()["lead"]["last_note"] == "Discussed the proposal."
    client.post(url + "/discussions", json={"note": "A second conversation."})
    detail = client.get(url).json()
    assert detail["discussions"][0]["note"] == "A second conversation."
    assert detail["follow_up_at"] == "2026-10-16T09:00:00Z"
    assert client.get("/api/leads").json()[0]["last_note"] == "A second conversation."
    for status in LeadStatus:
        assert client.patch(url, json={"status": status}).json()["status"] == status
    with Session(db_engine) as session:
        assert session.get(Lead, lead["id"]).status == LeadStatus.LOST
    assert client.patch(url, json={"follow_up_at": None}).json()["follow_up_at"] is None
    assert client.get(url).json()["discussions"][1]["follow_up_at"] is not None


@pytest.mark.parametrize(
    "payload", [{"status": "Other"}, {"status": None}, {}, {"follow_up_at": "2026-10-16T00:00:00Z"}]
)
def test_invalid_patch(client, payload):
    lead = create(client)
    assert client.patch(f"/api/leads/{lead['id']}", json=payload).status_code == 422


def test_missing_leads(client):
    assert client.get("/api/leads/999").status_code == 404
    assert client.patch("/api/leads/999", json={"status": "Won"}).status_code == 404
    assert client.post("/api/leads/999/discussions", json={"note": "Hi"}).status_code == 404


def test_tied_timestamps_use_descending_id(client, db_engine):
    lead = create(client)
    with Session(db_engine) as session:
        for note in ["First", "Second"]:
            session.add(
                Discussion(
                    lead_id=lead["id"], note=note, created_at=datetime(2026, 1, 1, tzinfo=UTC)
                )
            )
        session.commit()
    assert client.get(f"/api/leads/{lead['id']}").json()["discussions"][0]["note"] == "Second"
    assert client.get("/api/leads").json()[0]["last_note"] == "Second"


def test_failed_transaction_rolls_back_both_records(db_engine):
    with Session(db_engine) as session:
        lead = Lead(name="Rollback")
        session.add(lead)
        session.commit()
        lead_id = lead.id

        def fail_after_flush(_session, _context):
            raise RuntimeError("Simulated failure after SQL writes")

        event.listen(session, "after_flush", fail_after_flush)
        with pytest.raises(RuntimeError):
            add_discussion(
                session,
                lead_id,
                DiscussionCreate(
                    note="Must not persist",
                    follow_up_at=datetime(2026, 10, 16, tzinfo=UTC),
                ),
            )
        event.remove(session, "after_flush", fail_after_flush)
    with Session(db_engine) as session:
        assert session.get(Lead, lead_id).follow_up_at is None
        assert session.exec(select(func.count()).select_from(Discussion)).one() == 0


def test_seed_is_idempotent_and_preserves_edits(db_engine):
    with Session(db_engine) as session:
        now = datetime(2026, 10, 16, 7, tzinfo=UTC)
        assert seed(session, now, "Asia/Kolkata") == 8
        lead = session.exec(select(Lead)).first()
        lead.name = "User edit"
        session.add(lead)
        session.commit()
        assert seed(session, now, "Asia/Kolkata") == 0
        assert session.exec(select(func.count()).select_from(Lead)).one() == 8
        assert session.exec(select(func.count()).select_from(Discussion)).one() == 14
        assert session.get(Lead, lead.id).name == "User edit"


def test_unexpected_error_is_safe_and_has_cors(client, monkeypatch):
    def fail(_session):
        raise RuntimeError("private database password")

    monkeypatch.setattr("app.routes.summaries", fail)
    response = client.get("/api/leads", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 500
    assert "private" not in response.text
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
