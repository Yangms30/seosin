"""Cluster raw articles by title + summary similarity, pick representatives.

Stack (tuned Day 5):
  - Normalize titles (strip [종합]/[사설]/[단독] prefixes and "- 언론사명" suffixes
    so the model-irrelevant boilerplate doesn't inflate TF-IDF weights).
  - Use title *and* a short slice of the summary as the clustering text,
    with the title repeated so it weighs more.
  - Token unigrams + bigrams with sublinear TF, so word combinations and
    rare informative terms matter more than brute frequency.
  - Threshold 0.45 (was 0.6) — with the richer features we want to be more
    aggressive about merging near-duplicates.
  - Post-select safety net: after picking the final top-N articles, check
    pairwise similarity and swap in the next candidate if any two picks
    are still over 0.55 similar.
"""
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

# Titles often carry editorial tags ("[종합]", "[속보]", "[단독]", "[사설]",
# "(종합2보)") and a trailing "- 언론사명". These leak into TF-IDF vocabulary
# and distort similarity — two unrelated Yonhap articles both end in
# "- 연합뉴스", inflating their cosine. Strip them before tokenizing.
_TITLE_PREFIX_NOISE = re.compile(
    r"^\s*(?:\[[^\]]{1,15}\]|\([^)]{1,15}\))\s*"
)
_TITLE_SUFFIX_NOISE = re.compile(
    r"\s*[-–—]\s*"
    r"[가-힣A-Za-z0-9·\s]{1,20}"
    r"(?:일보|뉴스|타임즈|타임|경제|방송|TV|신문|미디어|데일리|NEWS|뉴시스|통신|사이언스타임즈)"
    r"\s*$",
    flags=re.IGNORECASE,
)


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


def normalize_title(title: str) -> str:
    """Strip editorial prefixes and trailing outlet names from a news title."""
    if not title:
        return ""
    t = title
    # Peel off any number of stacked prefixes: "[종합][단독] ..."
    for _ in range(3):
        stripped = _TITLE_PREFIX_NOISE.sub("", t)
        if stripped == t:
            break
        t = stripped
    # Remove trailing "- 조선일보" / "- 연합뉴스" / "- 사이언스타임즈" etc.
    t = _TITLE_SUFFIX_NOISE.sub("", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _tokenize_ko(text: str) -> list[str]:
    # Lightweight tokenizer: whitespace/punctuation split, drop tokens < 2 chars.
    tokens = re.findall(r"[\w가-힣]+", text or "")
    return [t for t in tokens if len(t) >= 2]


def _article_text_for_clustering(a: RawArticle) -> str:
    """Build the text passed to TF-IDF.

    Title is weighted by appearing twice so it outweighs a single pass of
    summary text. Summary is truncated to keep long bodies from dominating.
    """
    title = normalize_title(a.title)
    summary = _clean(a.summary or "")[:300]
    return f"{title} {title} {summary}"


def cluster_articles(
    articles: list[RawArticle],
    threshold: float = 0.45,
) -> list[Cluster]:
    if not articles:
        return []
    if len(articles) == 1:
        a = articles[0]
        return [Cluster(members=[a], representative_text=_clean(f"{a.title}. {a.summary}"))]

    texts = [_article_text_for_clustering(a) for a in articles]
    try:
        vec = TfidfVectorizer(
            tokenizer=_tokenize_ko,
            lowercase=False,
            token_pattern=None,
            ngram_range=(1, 2),     # unigram + bigram captures short phrases
            sublinear_tf=True,      # tame high-frequency filler words
            min_df=1,
        )
        matrix = vec.fit_transform(texts)
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
    logger.info(
        "Clustered %d articles into %d clusters (threshold=%.2f)",
        n,
        len(clusters),
        threshold,
    )
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

    Strategy:
    1. First pass — one article per cluster (by size desc), prefer unseen source.
    2. Second pass — fill remaining slots from untouched members.
    3. Safety pass — pairwise TF-IDF similarity check between picks. If any
       two picks are >0.55 similar (meaning clustering split one story into
       two), swap the later one for the next best pool candidate.
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

    picked = picked[:n]
    if len(picked) < 2:
        return picked

    # Safety pass — pairwise similarity check on the final picks.
    pool: list[RawArticle] = []
    picked_links = {a.link for a in picked}
    for c in clusters:
        for m in c.members:
            if m.link in picked_links:
                continue
            pool.append(m)

    POST_SIM_MAX = 0.55
    max_swaps = 4  # guard against infinite loops on pathologically similar input

    while max_swaps > 0 and pool:
        texts = [_article_text_for_clustering(a) for a in picked]
        try:
            vec = TfidfVectorizer(
                tokenizer=_tokenize_ko,
                lowercase=False,
                token_pattern=None,
                ngram_range=(1, 2),
                sublinear_tf=True,
                min_df=1,
            )
            matrix = vec.fit_transform(texts)
            sim = cosine_similarity(matrix)
        except ValueError:
            break

        worst_i, worst_j, worst_sim = -1, -1, 0.0
        for i in range(len(picked)):
            for j in range(i + 1, len(picked)):
                if sim[i, j] > worst_sim:
                    worst_sim = float(sim[i, j])
                    worst_i, worst_j = i, j
        if worst_sim <= POST_SIM_MAX:
            break

        # Swap out the later pick (worst_j) for the next pool candidate whose
        # similarity to the *retained* picks is all below POST_SIM_MAX.
        replacement = None
        for cand_idx, cand in enumerate(pool):
            cand_text = _article_text_for_clustering(cand)
            corpus = [_article_text_for_clustering(picked[k]) for k in range(len(picked)) if k != worst_j]
            corpus.append(cand_text)
            try:
                vec2 = TfidfVectorizer(
                    tokenizer=_tokenize_ko,
                    lowercase=False,
                    token_pattern=None,
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=1,
                )
                mat2 = vec2.fit_transform(corpus)
                sim2 = cosine_similarity(mat2)
            except ValueError:
                replacement = cand_idx
                break
            cand_row = sim2[-1, :-1]
            if np.max(cand_row) <= POST_SIM_MAX:
                replacement = cand_idx
                break

        if replacement is None:
            # No good swap available — accept the current picks.
            break
        logger.info(
            "pick_top: post-select dedup swap (sim=%.2f between %d and %d)",
            worst_sim,
            worst_i,
            worst_j,
        )
        picked[worst_j] = pool.pop(replacement)
        max_swaps -= 1

    return picked
