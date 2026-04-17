"""Gemini-based analyzer with harness: validation, retries, importance recompute."""
from __future__ import annotations
import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any

import google.generativeai as genai

from config import get_settings
from prompts.briefing import BRIEFING_SYSTEM, BRIEFING_USER_TEMPLATE
from prompts.extract import EXTRACT_SYSTEM, EXTRACT_USER_TEMPLATE
from prompts.radio_script import RADIO_SYSTEM, RADIO_USER_TEMPLATE

from .preprocessor import Cluster

logger = logging.getLogger(__name__)

REQUIRED_EXTRACT_FIELDS = {"topic", "key_entities", "core_fact", "sentiment", "importance_score"}


@dataclass
class AnalyzedBriefing:
    category: str
    title: str
    summary: str
    radio_script: str | None
    importance_score: float
    raw_analysis: dict[str, Any]
    source_articles: list[dict[str, Any]]


class GeminiAnalyzer:
    def __init__(self):
        cfg = get_settings()
        if not cfg.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not set in .env")
        genai.configure(api_key=cfg.GEMINI_API_KEY)
        self.model_name = cfg.GEMINI_MODEL
        self.max_retries = cfg.LLM_MAX_RETRIES
        self._model_json = genai.GenerativeModel(
            self.model_name,
            generation_config={"response_mime_type": "application/json", "temperature": 0.3},
        )
        self._model_text = genai.GenerativeModel(
            self.model_name,
            generation_config={"temperature": 0.5},
        )

    # ---------- public ----------
    def analyze_clusters(self, category: str, clusters: list[Cluster], top_k: int = 3) -> list[AnalyzedBriefing]:
        results: list[AnalyzedBriefing] = []
        for cluster in clusters[:top_k]:
            try:
                analyzed = self._analyze_one(category, cluster)
                if analyzed:
                    results.append(analyzed)
            except Exception as exc:
                logger.exception("Cluster analysis failed for %s: %s", category, exc)
        return results

    # ---------- per-cluster ----------
    def _analyze_one(self, category: str, cluster: Cluster) -> AnalyzedBriefing | None:
        extract = self._step1_extract(category, cluster)
        if not extract:
            return None
        briefing_text = self._step2_briefing(category, extract)
        if not briefing_text:
            return None
        radio_text = self._step2_radio(category, briefing_text)

        importance = self._recompute_importance(extract.get("importance_score", 5), cluster.size)
        sources = [
            {"title": m.title, "url": m.link, "source": m.source}
            for m in cluster.members
        ]
        return AnalyzedBriefing(
            category=category,
            title=str(extract.get("topic") or cluster.members[0].title)[:500],
            summary=briefing_text,
            radio_script=radio_text,
            importance_score=importance,
            raw_analysis=extract,
            source_articles=sources,
        )

    # ---------- LLM steps ----------
    def _step1_extract(self, category: str, cluster: Cluster) -> dict[str, Any] | None:
        user = EXTRACT_USER_TEMPLATE.format(category=category, context=cluster.representative_text)
        prompt = f"{EXTRACT_SYSTEM}\n\n{user}"
        for attempt in range(self.max_retries + 1):
            try:
                resp = self._model_json.generate_content(prompt)
                text = (resp.text or "").strip()
                data = self._parse_json(text)
                if data and REQUIRED_EXTRACT_FIELDS.issubset(data.keys()):
                    return data
                logger.warning("extract validation failed (attempt %d): %s", attempt, text[:200])
            except Exception as exc:
                logger.warning("extract LLM error (attempt %d): %s", attempt, exc)
                time.sleep(0.5 * (attempt + 1))
        return None

    def _step2_briefing(self, category: str, extract: dict[str, Any]) -> str | None:
        user = BRIEFING_USER_TEMPLATE.format(category=category, extract_json=json.dumps(extract, ensure_ascii=False))
        prompt = f"{BRIEFING_SYSTEM}\n\n{user}"
        try:
            resp = self._model_text.generate_content(prompt)
            text = (resp.text or "").strip()
            return text or None
        except Exception as exc:
            logger.warning("briefing LLM error: %s", exc)
            return None

    def _step2_radio(self, category: str, briefing: str) -> str | None:
        user = RADIO_USER_TEMPLATE.format(category=category, briefing=briefing)
        prompt = f"{RADIO_SYSTEM}\n\n{user}"
        try:
            resp = self._model_text.generate_content(prompt)
            text = (resp.text or "").strip()
            return text or None
        except Exception as exc:
            logger.warning("radio LLM error: %s", exc)
            return None

    # ---------- helpers ----------
    @staticmethod
    def _parse_json(text: str) -> dict[str, Any] | None:
        if not text:
            return None
        # Strip code fences if model added them
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        try:
            data = json.loads(text)
            return data if isinstance(data, dict) else None
        except json.JSONDecodeError:
            # Try to extract first {...} blob
            m = re.search(r"\{[\s\S]*\}", text)
            if m:
                try:
                    return json.loads(m.group(0))
                except json.JSONDecodeError:
                    return None
            return None

    @staticmethod
    def _recompute_importance(llm_score: Any, cluster_size: int) -> float:
        try:
            base = float(llm_score)
        except (TypeError, ValueError):
            base = 5.0
        base = max(1.0, min(10.0, base))
        # Multi-source bonus: each extra source adds 0.3, cap at +2.0
        bonus = min(2.0, max(0, cluster_size - 1) * 0.3)
        return round(min(10.0, base * 0.7 + bonus + 1.5), 2)
