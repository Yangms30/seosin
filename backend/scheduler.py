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

# The full pipeline (collect → cluster → LLM summaries × 3 → LLM radio
# synth → TTS × N → dispatch to every channel) takes ~5 minutes end-to-end
# in a typical run. If the user asks for delivery at 08:00 we want the
# email/Slack to actually *arrive* around 08:00, not start at 08:00 and
# land at 08:05. So when we register a cron trigger we shift the fire
# time this many minutes earlier than what the user typed.
_PIPELINE_OFFSET_MINUTES = 3


def _trigger_from_user_cron(cron: str) -> CronTrigger:
    """Build a CronTrigger that fires _PIPELINE_OFFSET_MINUTES earlier than
    the user's configured time, so by the time the pipeline finishes the
    delivery arrives close to the requested clock time.

    Only shifts the simple "M H * * *" shape produced by the settings UI
    (fixed minute + fixed hour). Any complex cron expression (ranges,
    step values, wildcards in M/H) falls back to the original string
    untouched — better to fire on time than break on parsing.
    """
    parts = cron.strip().split()
    if len(parts) != 5:
        return CronTrigger.from_crontab(cron, timezone=_TIMEZONE)
    m_str, h_str, dom, mon, dow = parts
    try:
        minute = int(m_str)
        hour = int(h_str)
    except ValueError:
        return CronTrigger.from_crontab(cron, timezone=_TIMEZONE)

    total = hour * 60 + minute - _PIPELINE_OFFSET_MINUTES
    total %= 24 * 60   # wrap around midnight
    new_hour, new_min = divmod(total, 60)
    adjusted = f"{new_min} {new_hour} {dom} {mon} {dow}"
    logger.info(
        "scheduler: cron %r → fires at %r (%d min earlier for pipeline prep)",
        cron,
        adjusted,
        _PIPELINE_OFFSET_MINUTES,
    )
    return CronTrigger.from_crontab(adjusted, timezone=_TIMEZONE)


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
                    trig = _trigger_from_user_cron(s.schedule_cron)
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
            trig = _trigger_from_user_cron(cron)
            _scheduler.add_job(_run_for_user, trigger=trig, args=[user_id], id=jid, replace_existing=True)
            logger.info("scheduler: upserted user_id=%s cron=%s (offset=%d min)", user_id, cron, _PIPELINE_OFFSET_MINUTES)
        except Exception as exc:
            logger.warning("scheduler: invalid cron for user_id=%s: %s (%s)", user_id, cron, exc)
