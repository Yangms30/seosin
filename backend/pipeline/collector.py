"""Google News RSS collector. Single source — no API key required."""
from __future__ import annotations
import logging
import re
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from time import mktime
from urllib.parse import quote_plus

import feedparser
import httpx

logger = logging.getLogger(__name__)

# Category → Google News query (Korean, focused topics)
CATEGORY_QUERIES: dict[str, str] = {
    "정치": "정치 OR 국회 OR 대통령",
    "경제": "한국 경제 OR 금리 OR 환율",
    "사회": "사회 OR 사건 OR 사고",
    "국제": "국제 OR 외신 OR 해외",
    "스포츠": "스포츠 OR 야구 OR 축구 OR 손흥민",
    "IT/과학": "IT OR 인공지능 OR 반도체 OR 과학",
}

RSS_TEMPLATE = "https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"


@dataclass
class RawArticle:
    title: str
    link: str
    published: datetime | None
    source: str | None
    summary: str

    def to_dict(self) -> dict:
        d = asdict(self)
        d["published"] = self.published.isoformat() if self.published else None
        return d


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _parse_published(entry) -> datetime | None:
    if getattr(entry, "published_parsed", None):
        return datetime.fromtimestamp(mktime(entry.published_parsed), tz=timezone.utc)
    return None


class GoogleRSSClient:
    def __init__(
        self,
        hours: int = 24,
        per_category: int = 20,
        timeout: float = 20.0,
        max_attempts: int = 3,
        backoff_base: float = 1.0,
    ):
        self.hours = hours
        self.per_category = per_category
        self.timeout = timeout
        self.max_attempts = max_attempts
        self.backoff_base = backoff_base

    def fetch(self, category: str) -> list[RawArticle]:
        query = CATEGORY_QUERIES.get(category, category)
        url = RSS_TEMPLATE.format(query=quote_plus(query))
        # Google News RSS occasionally times out or drops slow queries. A single
        # 10s attempt was too fragile (1/6 success rate in a real run), so try
        # up to `max_attempts` times with linear backoff. Still degrades to
        # "return []" on total failure so the rest of the pipeline is unaffected.
        feed = None
        last_err: Exception | None = None
        for attempt in range(1, self.max_attempts + 1):
            try:
                with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                    resp = client.get(url, headers={"User-Agent": "Mozilla/5.0 BriefBot/0.1"})
                    resp.raise_for_status()
                    feed = feedparser.parse(resp.content)
                break
            except Exception as exc:
                last_err = exc
                logger.warning(
                    "RSS fetch failed for %s (attempt %d/%d): %s",
                    category,
                    attempt,
                    self.max_attempts,
                    exc,
                )
                if attempt < self.max_attempts:
                    time.sleep(self.backoff_base * attempt)
        if feed is None:
            logger.warning("RSS giving up on %s after %d attempts: %s", category, self.max_attempts, last_err)
            return []

        cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=self.hours)
        out: list[RawArticle] = []
        for entry in feed.entries[: self.per_category * 2]:
            published = _parse_published(entry)
            if published and published < cutoff:
                continue
            source_title = None
            src = getattr(entry, "source", None)
            if src and isinstance(src, dict):
                source_title = src.get("title")
            elif hasattr(entry, "source") and hasattr(entry.source, "title"):
                source_title = entry.source.title
            out.append(
                RawArticle(
                    title=_strip_html(entry.title),
                    link=entry.link,
                    published=published,
                    source=source_title,
                    summary=_strip_html(getattr(entry, "summary", "")),
                )
            )
            if len(out) >= self.per_category:
                break
        logger.info("Collected %d articles for category=%s", len(out), category)
        return out

    def fetch_all(self, categories: list[str]) -> dict[str, list[RawArticle]]:
        return {c: self.fetch(c) for c in categories}
