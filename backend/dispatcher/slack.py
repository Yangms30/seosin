"""Slack Incoming Webhook sender: multi-category report with Block Kit."""
from __future__ import annotations
import logging

import httpx

from models import Report

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


def _build_blocks(user_name: str, reports: list[Report]) -> list[dict]:
    blocks: list[dict] = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"[서신] {user_name}님의 오늘의 리포트"[:150]},
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"분야 {len(reports)}개 · 기사 {sum(len(r.articles) for r in reports)}건"}
            ],
        },
        {"type": "divider"},
    ]
    for r in reports:
        blocks.append(
            {"type": "section", "text": {"type": "mrkdwn", "text": f"*■ {r.category}*"}}
        )
        for a in r.articles:
            text = f"*<{a.link}|{a.title[:120]}>*\n_{a.source or '출처 미상'}_\n{a.summary[:600]}"
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": text[:2900]}})
        if r.radio_script:
            blocks.append(
                {
                    "type": "context",
                    "elements": [
                        {"type": "mrkdwn", "text": f"🎧 *{r.category} 라디오*\n{r.radio_script[:2900]}"}
                    ],
                }
            )
        blocks.append({"type": "divider"})
    return blocks


class SlackSender:
    @staticmethod
    def send(webhook_url: str, user_name: str, reports: list[Report]) -> tuple[str, str | None]:
        if not webhook_url or not webhook_url.startswith("http"):
            return "failed", "invalid webhook url"
        if not reports:
            return "skipped", "no reports to send"
        payload = {
            "text": f"[서신] {user_name}님의 오늘의 리포트",
            "blocks": _build_blocks(user_name, reports),
        }
        try:
            resp = httpx.post(webhook_url, json=payload, timeout=_TIMEOUT)
        except httpx.HTTPError as exc:
            logger.warning("slack send error: %s", exc)
            return "failed", str(exc)
        if resp.status_code >= 400:
            logger.warning("slack non-2xx: %s %s", resp.status_code, resp.text[:200])
            return "failed", f"http {resp.status_code}: {resp.text[:200]}"
        return "success", None
