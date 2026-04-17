import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Briefing
from pipeline.service import generate_briefings_for_user
from schemas import BriefingGenerateResponse, BriefingOut

router = APIRouter()


def _to_out(b: Briefing) -> BriefingOut:
    return BriefingOut(
        id=b.id,
        user_id=b.user_id,
        category=b.category,
        title=b.title,
        summary=b.summary,
        radio_script=b.radio_script,
        source_articles=json.loads(b.source_articles) if b.source_articles else [],
        importance_score=b.importance_score,
        raw_analysis=json.loads(b.raw_analysis) if b.raw_analysis else None,
        created_at=b.created_at,
    )


@router.get("", response_model=list[BriefingOut])
def list_briefings(
    user_id: int = Query(...),
    category: str | None = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Briefing).filter(Briefing.user_id == user_id)
    if category and category != "전체":
        q = q.filter(Briefing.category == category)
    items = q.order_by(Briefing.created_at.desc()).limit(limit).all()
    return [_to_out(b) for b in items]


@router.get("/{briefing_id}", response_model=BriefingOut)
def get_briefing(briefing_id: int, db: Session = Depends(get_db)):
    b = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not b:
        raise HTTPException(404, "Briefing not found")
    return _to_out(b)


@router.post("/generate", response_model=BriefingGenerateResponse)
def generate_now(user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        created = generate_briefings_for_user(db, user_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))
    return BriefingGenerateResponse(
        user_id=user_id,
        generated=len(created),
        briefings=[_to_out(b) for b in created],
    )
