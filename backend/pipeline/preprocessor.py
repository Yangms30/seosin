"""Cluster raw articles by title similarity, pick representatives, clean noise."""
from __future__ import annotations
import logging
import re
from dataclasses import dataclass

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .collector import RawArticle

logger = logging.getLogger(__name__)

NOISE_PATTERNS = [
    r"\[.*?기자\]",
    r"\(.*?기자\)",
    r"무단전재.*?금지",
    r"저작권자.*?재배포금지",
    r"관련기사",
    r"포토뉴스",
]


@dataclass
class Cluster:
    members: list[RawArticle]
    representative_text: str  # cleaned concatenated context for LLM

    @property
    def size(self) -> int:
        return len(self.members)


def _clean(text: str) -> str:
    for pat in NOISE_PATTERNS:
        text = re.sub(pat, " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _tokenize_ko(text: str) -> list[str]:
    # Lightweight tokenizer: split on whitespace and punctuation, drop tokens < 2 chars
    tokens = re.findall(r"[\w가-힣]+", text)
    return [t for t in tokens if len(t) >= 2]


def cluster_articles(
    articles: list[RawArticle],
    threshold: float = 0.6,
) -> list[Cluster]:
    if not articles:
        return []
    if len(articles) == 1:
        a = articles[0]
        return [Cluster(members=[a], representative_text=_clean(f"{a.title}. {a.summary}"))]

    titles = [a.title for a in articles]
    try:
        vec = TfidfVectorizer(tokenizer=_tokenize_ko, lowercase=False, token_pattern=None)
        matrix = vec.fit_transform(titles)
    except ValueError:
        # All-empty vocabulary fallback: each article its own cluster
        return [
            Cluster(members=[a], representative_text=_clean(f"{a.title}. {a.summary}"))
            for a in articles
        ]
    sim = cosine_similarity(matrix)

    n = len(articles)
    visited = [False] * n
    clusters: list[Cluster] = []
    for i in range(n):
        if visited[i]:
            continue
        group_idx = [i]
        visited[i] = True
        for j in range(i + 1, n):
            if visited[j]:
                continue
            if sim[i, j] >= threshold:
                visited[j] = True
                group_idx.append(j)
        members = [articles[k] for k in group_idx]
        # Sort by published desc; take up to 3
        members.sort(key=lambda a: a.published or _epoch(), reverse=True)
        reps = _select_representatives(members, max_n=3)
        ctx = _build_context(reps)
        clusters.append(Cluster(members=reps, representative_text=ctx))

    # Sort clusters by size desc (more sources = more important signal)
    clusters.sort(key=lambda c: c.size, reverse=True)
    logger.info("Clustered %d articles into %d clusters", n, len(clusters))
    return clusters


def _epoch():
    from datetime import datetime, timezone
    return datetime.fromtimestamp(0, tz=timezone.utc)


def _select_representatives(members: list[RawArticle], max_n: int = 3) -> list[RawArticle]:
    seen_sources: set[str] = set()
    picked: list[RawArticle] = []
    for m in members:
        key = (m.source or "").strip()
        if key and key in seen_sources:
            continue
        picked.append(m)
        if key:
            seen_sources.add(key)
        if len(picked) >= max_n:
            break
    if not picked:
        picked = members[:max_n]
    return picked


def _build_context(reps: list[RawArticle]) -> str:
    parts = []
    for i, a in enumerate(reps, 1):
        body = _clean(f"{a.title}. {a.summary}")
        src = a.source or "출처 미상"
        parts.append(f"[기사{i} | {src}] {body}")
    return "\n".join(parts)


def pick_top_articles(clusters: list[Cluster], n: int = 3) -> list[RawArticle]:
    """Pick top-n individual articles across clusters with source diversity.

    Strategy: iterate clusters by importance (already sorted by size desc),
    take the cluster's first representative; prefer unseen sources. Fallback
    to any remaining representative when we run out of unique sources.
    """
    if not clusters:
        return []
    seen_sources: set[str] = set()
    picked: list[RawArticle] = []

    # First pass: one article per cluster, prefer unseen source
    for c in clusters:
        if len(picked) >= n:
            break
        for m in c.members:
            src = (m.source or "").strip()
            if src and src in seen_sources:
                continue
            picked.append(m)
            if src:
                seen_sources.add(src)
            break

    # Second pass: fill up from remaining members if under n
    if len(picked) < n:
        seen_links = {a.link for a in picked}
        for c in clusters:
            for m in c.members:
                if m.link in seen_links:
                    continue
                picked.append(m)
                seen_links.add(m.link)
                if len(picked) >= n:
                    break
            if len(picked) >= n:
                break

    return picked[:n]
