from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, text

from app.database import get_session
from app.models import Discussion, Lead, utc_now
from app.schemas import (
    DiscussionCreate,
    DiscussionResult,
    LeadCreate,
    LeadDetail,
    LeadPatch,
    LeadSummary,
)
from app.services import add_discussion, require_lead, summaries

router = APIRouter(prefix="/api")
DB = Annotated[Session, Depends(get_session)]


@router.get("/health")
def health(session: DB):
    session.exec(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/leads", response_model=list[LeadSummary])
def list_leads(session: DB):
    return summaries(session)


@router.post("/leads", response_model=LeadSummary, status_code=201)
def create_lead(payload: LeadCreate, session: DB):
    lead = Lead(**payload.model_dump())
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return LeadSummary.model_validate(lead)


@router.get("/leads/{lead_id}", response_model=LeadDetail)
def get_lead(lead_id: int, session: DB):
    require_lead(session, lead_id)
    discussions = session.exec(
        select(Discussion)
        .where(Discussion.lead_id == lead_id)
        .order_by(Discussion.created_at.desc(), Discussion.id.desc())
    ).all()
    return LeadDetail(**summaries(session, lead_id)[0].model_dump(), discussions=discussions)


@router.patch("/leads/{lead_id}", response_model=LeadSummary)
def update_lead(lead_id: int, payload: LeadPatch, session: DB):
    lead = require_lead(session, lead_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, key, value)
    lead.updated_at = utc_now()
    session.add(lead)
    session.commit()
    return summaries(session, lead_id)[0]


@router.post("/leads/{lead_id}/discussions", response_model=DiscussionResult, status_code=201)
def create_discussion(lead_id: int, payload: DiscussionCreate, session: DB):
    return add_discussion(session, lead_id, payload)
