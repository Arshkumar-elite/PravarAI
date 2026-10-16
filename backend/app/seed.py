"""Explicit, idempotent fictional demo data: uv run python -m app.seed."""

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlmodel import Session, select

from app.config import settings
from app.database import create_tables, engine
from app.models import Discussion, Lead, LeadStatus

EXAMPLES = [
    (
        "Sofia Chen",
        "Acme Studio",
        LeadStatus.PROPOSAL_SENT,
        "Shared the team plan and pricing. Sofia is reviewing with her co-founder.",
    ),
    (
        "James Wilson",
        "Layers",
        LeadStatus.QUALIFIED,
        "Great discovery call. Looking for a simpler way to manage their growing pipeline.",
    ),
    (
        "Aisha Patel",
        "Orbit Financial",
        LeadStatus.CONTACTED,
        "Sent an overview of the platform. Follow up after their Monday team meeting.",
    ),
    (
        "Oliver Brooks",
        "Northstar",
        LeadStatus.NEW,
        "Reached out through the website. Interested in a demo for the advisory team.",
    ),
    (
        "Emma Laurent",
        "Bloom & Co.",
        LeadStatus.QUALIFIED,
        "Confirmed a team of 12 advisors. A shared discussion history is the top priority.",
    ),
    (
        "Noah Williams",
        "Vertex Partners",
        LeadStatus.WON,
        "Signed and ready to get started. Introduced Noah to the onboarding team.",
    ),
    (
        "Isabella Rossi",
        "Forma",
        LeadStatus.LOST,
        "Timing is not right this quarter. Appreciated the walkthrough and will reconnect later.",
    ),
    ("Liam Davis", "Untitled Labs", LeadStatus.NEW, None),
]


def seed(session: Session, now: datetime | None = None, timezone: str | None = None) -> int:
    local_now = (now or datetime.now(UTC)).astimezone(ZoneInfo(timezone or settings.seed_timezone))
    midnight = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    reminders = [
        midnight + timedelta(hours=14, minutes=30),
        midnight + timedelta(hours=10),
        midnight - timedelta(days=1) + timedelta(hours=11),
        None,
        midnight + timedelta(days=2, hours=15),
        None,
        None,
        None,
    ]
    added = 0
    for index, (name, company, status, note) in enumerate(EXAMPLES):
        key = f"demo-v1-{index}"
        if session.exec(select(Lead).where(Lead.seed_key == key)).first():
            continue
        created = local_now - timedelta(days=12 + index)
        lead = Lead(
            name=name,
            company=company,
            phone=f"+1 (202) 555-{100 + index:04d}",
            status=status,
            follow_up_at=reminders[index],
            created_at=created,
            updated_at=local_now - timedelta(hours=3 + index * 5),
            seed_key=key,
        )
        session.add(lead)
        session.flush()
        if note:
            session.add(
                Discussion(
                    lead_id=lead.id,
                    note="Initial introduction. Discussed the team's workflow and goals.",
                    created_at=created + timedelta(hours=2),
                )
            )
            session.add(
                Discussion(
                    lead_id=lead.id,
                    note=note,
                    follow_up_at=reminders[index],
                    created_at=local_now - timedelta(hours=3 + index * 5),
                )
            )
        added += 1
    session.commit()
    return added


if __name__ == "__main__":
    create_tables()
    with Session(engine) as session:
        count = seed(session)
    print(f"Added {count} demo leads. Existing data was preserved.")
