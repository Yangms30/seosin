"""Seed demo user + settings + initial category reports.

Usage (from backend/ with venv activated):
    python scripts/seed.py
    python scripts/seed.py --email demo@briefbot.local --skip-generate
"""
from __future__ import annotations
import argparse
import json
import logging
import sys
from pathlib import Path

# Allow `python scripts/seed.py` invocation from backend/
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import Base, SessionLocal, engine  # noqa: E402
import models  # noqa: E402,F401  ensure models registered
from models import Setting, User  # noqa: E402
from pipeline.service import generate_reports_for_user  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger("seed")

DEFAULT_NAME = "시연용 사용자"
DEFAULT_EMAIL = "demo@briefbot.local"
DEFAULT_CATEGORIES = ["정치", "경제", "사회", "국제", "스포츠", "IT/과학"]
DEFAULT_CHANNELS = {"web": True}


def _upsert_user(db, name: str, email: str) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        logger.info("user exists: id=%s email=%s", existing.id, existing.email)
        return existing
    user = User(name=name, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("user created: id=%s email=%s", user.id, user.email)
    return user


def _upsert_setting(db, user_id: int, categories: list[str], channels: dict) -> Setting:
    setting = db.query(Setting).filter(Setting.user_id == user_id).first()
    cats_json = json.dumps(categories, ensure_ascii=False)
    chans_json = json.dumps(channels, ensure_ascii=False)
    if setting:
        setting.categories = cats_json
        setting.channels = chans_json
        logger.info("setting updated for user_id=%s", user_id)
    else:
        setting = Setting(user_id=user_id, categories=cats_json, channels=chans_json)
        db.add(setting)
        logger.info("setting created for user_id=%s", user_id)
    db.commit()
    db.refresh(setting)
    return setting


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", default=DEFAULT_NAME)
    ap.add_argument("--email", default=DEFAULT_EMAIL)
    ap.add_argument("--categories", nargs="+", default=DEFAULT_CATEGORIES, help="Korean category names")
    ap.add_argument("--skip-generate", action="store_true", help="Only create user/setting, skip LLM generation")
    args = ap.parse_args()

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user = _upsert_user(db, args.name, args.email)
        _upsert_setting(db, user.id, args.categories, DEFAULT_CHANNELS)

        if args.skip_generate:
            logger.info("skip-generate: done (user_id=%s)", user.id)
            print(f"seeded: user_id={user.id} email={user.email} (no reports generated)")
            return 0

        logger.info("generating reports for user_id=%s (categories=%d)…", user.id, len(args.categories))
        created = generate_reports_for_user(db, user.id)
        logger.info("generated %d reports", len(created))
        print(f"seeded: user_id={user.id} email={user.email} reports={len(created)}")
        return 0
    except Exception:
        logger.exception("seed failed")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
