from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from app.models import Discussion, Lead, utc_now
from app.schemas import DiscussionCreate, DiscussionRead, DiscussionResult, LeadSummary


def require_lead(session: Session, lead_id: int) -> Lead:
    lead = session.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def summaries(session: Session, lead_id: int | None = None) -> list[LeadSummary]:
    # A window query selects the latest discussion for every lead in one round trip.
    latest = select(
        Discussion.lead_id,
        Discussion.note,
        Discussion.created_at,
        func.row_number()
        .over(
            partition_by=Discussion.lead_id,
            order_by=(Discussion.created_at.desc(), Discussion.id.desc()),
        )
        .label("rank"),
    ).subquery()
    query = (
        select(Lead, latest.c.note, latest.c.created_at)
        .outerjoin(latest, (latest.c.lead_id == Lead.id) & (latest.c.rank == 1))
        .order_by(Lead.id)
    )
    if lead_id is not None:
        query = query.where(Lead.id == lead_id)
    return [
        LeadSummary.model_validate(lead).model_copy(
            update={"last_note": note, "last_discussion_at": created_at}
        )
        for lead, note, created_at in session.exec(query).all()
    ]


def add_discussion(session: Session, lead_id: int, payload: DiscussionCreate) -> DiscussionResult:
    lead = require_lead(session, lead_id)
    discussion = Discussion(lead_id=lead_id, **payload.model_dump())
    try:
        session.add(discussion)
        if payload.follow_up_at is not None:
            lead.follow_up_at = payload.follow_up_at
        lead.updated_at = utc_now()
        session.add(lead)
        session.commit()
    except Exception:
        session.rollback()
        raise
    session.refresh(discussion)
    return DiscussionResult(
        discussion=DiscussionRead.model_validate(discussion),
        lead=summaries(session, lead_id)[0],
    )
