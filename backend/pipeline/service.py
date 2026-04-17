"""High-level orchestration: collect → preprocess → analyze → persist."""
from __future__ import annotations
import json
import logging

from sqlalchemy.orm import Session

from config import get_settings
from models import Briefing, Setting

from .analyzer import GeminiAnalyzer
from .collector import GoogleRSSClient
from .preprocessor import cluster_articles

logger = logging.getLogger(__name__)


def generate_briefings_for_user(db: Session, user_id: int) -> list[Briefing]:
    cfg = get_settings()
    setting: Setting | None = db.query(Setting).filter(Setting.user_id == user_id).first()
    if not setting:
        raise ValueError(f"No settings found for user_id={user_id}")
    categories: list[str] = json.loads(setting.categories)
    if not categories:
        return []

    collector = GoogleRSSClient(hours=cfg.ARTICLE_HOURS, per_category=cfg.COLLECT_PER_CATEGORY)
    analyzer = GeminiAnalyzer()

    created: list[Briefing] = []
    for category in categories:
        raw = collector.fetch(category)
        if not raw:
            logger.info("No articles for %s, skipping", category)
            continue
        clusters = cluster_articles(raw, threshold=cfg.CLUSTER_THRESHOLD)
        if not clusters:
            continue
        analyzed = analyzer.analyze_clusters(category, clusters, top_k=3)
        for a in analyzed:
            briefing = Briefing(
                user_id=user_id,
                category=a.category,
                title=a.title,
                summary=a.summary,
                radio_script=a.radio_script,
                source_articles=json.dumps(a.source_articles, ensure_ascii=False),
                importance_score=a.importance_score,
                raw_analysis=json.dumps(a.raw_analysis, ensure_ascii=False),
            )
            db.add(briefing)
            created.append(briefing)
    db.commit()
    for b in created:
        db.refresh(b)
    logger.info("Generated %d briefings for user_id=%d", len(created), user_id)
    return created
