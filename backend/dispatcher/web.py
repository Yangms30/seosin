"""Web channel = dashboard. Reports are already persisted — no-op."""
from __future__ import annotations
import logging

logger = logging.getLogger(__name__)


class WebSender:
    @staticmethod
    def send(reports) -> tuple[str, str | None]:
        logger.info("web channel: %d reports visible on dashboard", len(reports))
        return "success", None
