import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Setting, User
from schemas import SettingOut, SettingPayload

router = APIRouter()


def _to_out(s: Setting) -> SettingOut:
    return SettingOut(
        id=s.id,
        user_id=s.user_id,
        categories=json.loads(s.categories),
        schedule_cron=s.schedule_cron,
        channels=json.loads(s.channels),
        updated_at=s.updated_at,
    )


@router.put("/{user_id}", response_model=SettingOut)
def upsert_settings(user_id: int, payload: SettingPayload, db: Session = Depends(get_db)):
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(404, "User not found")
    setting = db.query(Setting).filter(Setting.user_id == user_id).first()
    cats_json = json.dumps(payload.categories, ensure_ascii=False)
    chans_json = json.dumps(payload.channels, ensure_ascii=False)
    if setting:
        setting.categories = cats_json
        setting.schedule_cron = payload.schedule_cron
        setting.channels = chans_json
    else:
        setting = Setting(
            user_id=user_id,
            categories=cats_json,
            schedule_cron=payload.schedule_cron,
            channels=chans_json,
        )
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return _to_out(setting)


@router.get("/{user_id}", response_model=SettingOut)
def get_settings(user_id: int, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.user_id == user_id).first()
    if not setting:
        raise HTTPException(404, "Settings not found")
    return _to_out(setting)
