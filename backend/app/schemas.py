from datetime import datetime
from typing import Annotated, Self

from pydantic import AwareDatetime, BaseModel, ConfigDict, StringConstraints, model_validator

from app.models import LeadStatus

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Note = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]
Company = Annotated[str, StringConstraints(strip_whitespace=True, max_length=160)]
Phone = Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)]


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Name
    company: Company | None = None
    phone: Phone | None = None


class LeadPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: LeadStatus | None = None
    # Setting a reminder belongs to a discussion. PATCH can only clear it.
    follow_up_at: None = None

    @model_validator(mode="after")
    def validate_patch(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("Provide status or follow_up_at")
        if "status" in self.model_fields_set and self.status is None:
            raise ValueError("Status cannot be null")
        return self


class DiscussionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    note: Note
    follow_up_at: AwareDatetime | None = None


class LeadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    follow_up_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_note: str | None = None
    last_discussion_at: datetime | None = None


class DiscussionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lead_id: int
    note: str
    follow_up_at: datetime | None
    created_at: datetime


class LeadDetail(LeadSummary):
    discussions: list[DiscussionRead]


class DiscussionResult(BaseModel):
    discussion: DiscussionRead
    lead: LeadSummary
