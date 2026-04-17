"""Manual send trigger. Day-3 will wire actual Slack/Email senders."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Briefing, SendLog
from schemas import SendResult

router = APIRouter()


@router.post("/{briefing_id}", response_model=list[SendResult])
def send_briefing(briefing_id: int, db: Session = Depends(get_db)):
    b = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not b:
        raise HTTPException(404, "Briefing not found")
    # TODO Day-3: read Setting.channels and dispatch
    log = SendLog(briefing_id=briefing_id, channel="web", status="success")
    db.add(log)
    db.commit()
    return [SendResult(channel="web", status="success")]
