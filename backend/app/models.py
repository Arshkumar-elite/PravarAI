from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import Column, DateTime, Enum, String, TypeDecorator
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator):
    """SQLite drops timezone metadata; restore UTC at the database boundary."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("A timezone-aware datetime is required")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=UTC) if value is not None else None


class LeadStatus(StrEnum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    PROPOSAL_SENT = "Proposal Sent"
    WON = "Won"
    LOST = "Lost"


class Lead(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=120)
    company: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    status: LeadStatus = Field(
        default=LeadStatus.NEW,
        sa_column=Column(Enum(LeadStatus, create_constraint=True), nullable=False),
    )
    follow_up_at: datetime | None = Field(default=None, sa_column=Column(UTCDateTime))
    created_at: datetime = Field(
        default_factory=utc_now, sa_column=Column(UTCDateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=utc_now, sa_column=Column(UTCDateTime, nullable=False)
    )
    seed_key: str | None = Field(default=None, sa_column=Column(String, unique=True))


class Discussion(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    lead_id: int = Field(foreign_key="lead.id", index=True)
    note: str = Field(max_length=5000)
    follow_up_at: datetime | None = Field(default=None, sa_column=Column(UTCDateTime))
    created_at: datetime = Field(
        default_factory=utc_now, sa_column=Column(UTCDateTime, nullable=False)
    )
