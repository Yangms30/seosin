from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------- User ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    created_at: datetime


# ---------- Setting ----------
class SettingPayload(BaseModel):
    categories: list[str]
    schedule_cron: str | None = None
    channels: dict[str, Any]  # {web: true, slack: "url", email: "addr"}


class SettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    categories: list[str]
    schedule_cron: str | None
    channels: dict[str, Any]
    updated_at: datetime


# ---------- Briefing ----------
class SourceArticle(BaseModel):
    title: str
    url: str
    source: str | None = None


class BriefingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    category: str
    title: str
    summary: str
    radio_script: str | None
    source_articles: list[SourceArticle]
    importance_score: float | None
    raw_analysis: dict[str, Any] | None
    created_at: datetime


class BriefingGenerateResponse(BaseModel):
    user_id: int
    generated: int
    briefings: list[BriefingOut]


# ---------- Send ----------
class SendResult(BaseModel):
    channel: str
    status: str
    error_msg: str | None = None
