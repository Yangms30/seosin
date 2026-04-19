"""APScheduler BackgroundScheduler — per-user cron jobs for auto reports.

NOTE: Currently disabled at startup (see main.py). Kept intact so it can be
re-enabled post-demo by uncommenting the lifespan hooks.
"""
from __future__ import annotations
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from database import SessionLocal
from dispatcher import dispatch_user_reports
from models import Setting
from pipeline.service import generate_reports_for_user

logger = logging.getLogger(__name__)

_TIMEZONE = "Asia/Seoul"
_scheduler: BackgroundScheduler | None = None


def _job_id(user_id: int) -> str:
    return f"user_{user_id}"


def _run_for_user(user_id: int) -> None:
    """Job body: generate reports then dispatch through active channels."""
    db = SessionLocal()
    try:
        try:
            created = generate_reports_for_user(db, user_id)
        except Exception:
            logger.exception("scheduled generate failed for user_id=%s", user_id)
            return
        logger.info("scheduled: generated %d reports for user_id=%s", len(created), user_id)
        try:
            dispatch_user_reports(db, user_id)
        except Exception:
            logger.exception("scheduled dispatch failed for user_id=%s", user_id)
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return _scheduler

    sched = BackgroundScheduler(timezone=_TIMEZONE)
    db = SessionLocal()
    try:
        for s in db.query(Setting).all():
            if s.schedule_cron:
                try:
                    trig = CronTrigger.from_crontab(s.schedule_cron, timezone=_TIMEZONE)
                    sched.add_job(
                        _run_for_user,
                        trigger=trig,
                        args=[s.user_id],
                        id=_job_id(s.user_id),
                        replace_existing=True,
                    )
                    logger.info("scheduler: registered user_id=%s cron=%s", s.user_id, s.schedule_cron)
                except Exception as exc:
                    logger.warning("scheduler: invalid cron for user_id=%s: %s (%s)", s.user_id, s.schedule_cron, exc)
    finally:
        db.close()

    sched.start()
    _scheduler = sched
    logger.info("scheduler: started (tz=%s)", _TIMEZONE)
    return sched


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("scheduler: stopped")
    _scheduler = None


def upsert_user_job(user_id: int, cron: str | None) -> None:
    """Called from settings router — no-op when scheduler is not running."""
    if _scheduler is None:
        return
    jid = _job_id(user_id)
    if _scheduler.get_job(jid):
        _scheduler.remove_job(jid)
    if cron:
        try:
            trig = CronTrigger.from_crontab(cron, timezone=_TIMEZONE)
            _scheduler.add_job(_run_for_user, trigger=trig, args=[user_id], id=jid, replace_existing=True)
            logger.info("scheduler: upserted user_id=%s cron=%s", user_id, cron)
        except Exception as exc:
            logger.warning("scheduler: invalid cron for user_id=%s: %s (%s)", user_id, cron, exc)
