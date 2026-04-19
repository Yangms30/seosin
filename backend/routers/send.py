"""Manual send trigger: dispatch user's latest reports through all channels."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from dispatcher import dispatch_user_reports
from schemas import SendResponse, SendResult

router = APIRouter()


@router.post("", response_model=SendResponse)
def send_now(user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        results = dispatch_user_reports(db, user_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    return SendResponse(
        user_id=user_id,
        results=[SendResult(channel=r.channel, status=r.status, error_msg=r.error_msg) for r in results],
    )
