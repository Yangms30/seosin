# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

BriefBot — 공개 뉴스 소스를 수집/전처리/LLM 분석하여 웹/Slack/이메일/라디오(TTS)로 자동 브리핑하는 시스템. 서울신문 과제평가 제출용 프로토타입.

**설계 원본은 루트 `plan.md`** (§1~§12: 아키텍처, DB 스키마, 프롬프트 구조, 일정). 구현을 변경할 때는 먼저 `plan.md`와 정합성 확인.

## 저장소 구조

```
briefBot/
├── frontend/   # Next.js 16 App Router (shadcn/ui + Tailwind 4 + Framer Motion)
├── backend/    # FastAPI + SQLAlchemy + SQLite, 뉴스 수집/LLM 분석 파이프라인
├── plan.md     # 설계 문서 (소스 오브 트루스)
└── docs/
```

## 영역별 가이드 (작업 위치에 따라 자동 로드됨)

- **프론트엔드 작업** → [`frontend/CLAUDE.md`](./frontend/CLAUDE.md): Next.js/shadcn 명령어, 라우트 구조, mock 데이터 현황, UI 규약.
- **백엔드 작업** → [`backend/CLAUDE.md`](./backend/CLAUDE.md): FastAPI 명령어, 파이프라인 3단 구조, LLM 모델 제약, DB 모델, 하네스 원칙.

영역별 상세 설명은 위 두 파일에만 있고 이 파일에 중복 기재하지 않음. 토큰 절약을 위해 작업 디렉토리에 해당하는 CLAUDE.md만 자동 로드되도록 분할.

## 전 영역 공통 규약

- 사용자는 한국어로 소통함 — 답변/README/UI 텍스트/프롬프트는 한국어, 코드 식별자/주석/로그는 영어.
- `frontend/`의 원래 이름은 v0.app이 생성한 `b_ydy857XxdS6`였으나 rename됨. 과거 커밋/문서에서 옛 이름이 보이면 `frontend/`로 해석.
- 구현 로드맵은 `/Users/yangminseok/.claude/plans/plan-md-deep-mochi.md` (Day 1~5 분할).
