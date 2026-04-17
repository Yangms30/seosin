# CLAUDE.md — backend/

This file provides guidance to Claude Code when working in the **backend/** directory.

## 개발 명령어

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # 최초 1회
pip install -r requirements.txt                    # 최초 1회
cp .env.example .env                               # .env에 GEMINI_API_KEY 입력
uvicorn main:app --reload                          # http://localhost:8000
```

- 포트 8000이 점유 중이면 `--port 8765` 등으로 변경 (검증 시 충돌 이력 있음).
- 테스트 프레임워크 미도입 — 수동 검증은 `python -c "from ..."` + `curl` 조합.
- DB 스키마 변경 후에는 `briefbot.db` 삭제 → 재기동(`main.py` lifespan에서 `Base.metadata.create_all`로 재생성).

## 파이프라인 3단 구조 ("프롬프트/컨텍스트/하네스 엔지니어링")

```
collector.py ──▶ preprocessor.py ──▶ analyzer.py ──▶ service.py ──▶ DB
(RSS 수집)        (TF-IDF 클러스터링)   (Gemini + 하네스)   (오케스트레이션)
```

- **`pipeline/collector.py`** — Google News RSS만 사용 (`feedparser`). 카테고리→쿼리 매핑은 `CATEGORY_QUERIES` 상수. 네이버/NewsAPI는 미발급이라 클라이언트 클래스가 없음. 추가 소스가 필요하면 같은 인터페이스(`RawArticle` 반환)로 새 Client 추가.
- **`pipeline/preprocessor.py`** — LLM 호출 없음. 제목을 TF-IDF 벡터화 후 코사인 유사도 ≥ `CLUSTER_THRESHOLD`(0.6)로 그리디 클러스터링. 클러스터당 대표 기사 2~3건(최신순 + 출처 다양성). 노이즈 제거는 `NOISE_PATTERNS` 정규식.
- **`pipeline/analyzer.py`** — **여기에만 LLM 호출 집중.** 3단 호출:
  1. `_step1_extract` — JSON 모드(`response_mime_type="application/json"`)로 `{topic, key_entities, core_fact, sentiment, importance_score}` 추출. 파싱 실패 시 `LLM_MAX_RETRIES`회 재시도.
  2. `_step2_briefing` — 3줄 한국어 브리핑(문어체).
  3. `_step2_radio` — 30초~1분 분량 구어체 라디오 스크립트.
  - 중요도는 LLM 점수와 클러스터 크기(출처 수) 가중치 조합으로 재계산 (`_recompute_importance`). 모델 출력을 그대로 믿지 않는 "하네스" 원칙.
- **`pipeline/service.py`** — `generate_briefings_for_user(db, user_id)`가 공개 진입점. 라우터(`POST /api/briefings/generate`)와 스케줄러(Day 3 예정)에서 공유.

## 프롬프트 분리 (`prompts/`)

프롬프트 텍스트는 `prompts/{extract,briefing,radio_script}.py`에 `*_SYSTEM`, `*_USER_TEMPLATE` 상수로 격리. 프롬프트 변경은 **이 파일만 수정**하고 `analyzer.py`는 건드리지 않는 것이 원칙. 변경 후 반드시 JSON 스키마 호환성(`REQUIRED_EXTRACT_FIELDS`) 확인.

## DB 모델 (`models.py`)

4개 테이블: `users`, `settings`, `briefings`, `send_logs`.

- `Setting.categories`, `Setting.channels`, `Briefing.source_articles`, `Briefing.raw_analysis`는 **JSON 문자열**로 저장 (SQLite 단순성 유지). 라우터의 `_to_out` 헬퍼에서 파싱.
- `User.email`만 unique. 로그인 개념 없음 — 프론트는 `localStorage`에 `user_id` 저장(Day 2 예정).

## LLM 모델 제약 (중요)

`.env`의 `GEMINI_MODEL` 기본값은 **`gemini-2.5-flash-lite`**. 이유:
- `gemini-1.5-flash`는 현재 API에서 404 (deprecated).
- `gemini-2.0-flash`는 이 프로젝트의 무료 티어 한도가 `limit: 0`.
- 모델을 바꾸려면 먼저 `genai.list_models()`로 해당 키에서 `generateContent` 지원 여부 확인.

Claude/네이버/NewsAPI 키는 미발급 상태. 키가 추가되면 `plan.md` §2의 "폴백 체인"/다중 소스를 본래 설계대로 확장 가능 (`analyzer.py`에 폴백 클라이언트 추가, `collector.py`에 Client 클래스 추가).

## 규약

- 새 라우터는 `routers/`에 파일 추가 후 `main.py`의 `app.include_router(...)`에 등록.
- 새 파이프라인 단계나 LLM 호출을 추가할 때는 **하네스 원칙 준수**: 출력 검증 → 재시도 → 실패 시 graceful 스킵. 전체 파이프라인이 한 클러스터 실패로 멈추면 안 됨 (`service.py` 참고).
- `.env`는 `.gitignore`에 포함. 키 노출 시 즉시 회전.
- 코드 식별자/주석/로그는 영어 유지 (UI 텍스트/프롬프트만 한국어).
