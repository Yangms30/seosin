# BriefBot

> 가벼운 LLM으로도 똑똑하게 — 파이프라인 엔지니어링으로 뉴스를 분석하고 자동 브리핑하는 시스템

서울신문 과제평가 제출용 AI 이슈 브리핑 프로토타입. Google News RSS에서 공개 뉴스를 수집하고, Gemini Flash Lite로 구조화된 브리핑(텍스트 + 라디오 스크립트)을 생성하여 웹/Slack/이메일 채널로 자동 전달하는 풀스택 시스템입니다.

설계 원본 문서: [`plan.md`](./plan.md)

## 핵심 차별화 전략

1. **프롬프트 엔지니어링** — 복잡한 태스크를 "구조화 추출(JSON) → 3줄 브리핑 → 라디오 스크립트" 3단계로 분해
2. **컨텍스트 엔지니어링** — LLM 호출 전 TF-IDF + 코사인 유사도(0.6)로 뉴스 클러스터링, 대표 기사 2~3건만 모델에 전달하여 경량 모델의 성능 극대화
3. **하네스 엔지니어링** — JSON 검증, 재시도, 규칙 기반 중요도 재계산 등 LLM 바깥에서 품질 보장
4. **라디오 모드** — 같은 이슈 데이터로 문어체 브리핑과 구어체 라디오 스크립트를 동시 생성, Web Speech API로 재생(Day 3 예정)

## 아키텍처

```
┌──────────────────┐     REST      ┌────────────────────────────────┐
│  Next.js 16 UI   │ ───────────▶  │  FastAPI                       │
│  (App Router)    │               │                                │
│  • 온보딩 5단계   │               │  Routers                       │
│  • 대시보드       │               │   ├─ users                     │
│  • 브리핑 상세    │               │   ├─ settings                  │
│  • 설정          │               │   ├─ briefings (generate 포함)  │
└──────────────────┘               │   └─ send         (Day 3)       │
                                   │                                │
                                   │  Pipeline                      │
                                   │   ├─ collector  (GoogleRSS)    │
                                   │   ├─ preprocessor (TF-IDF)     │
                                   │   └─ analyzer   (Gemini 3단)   │
                                   │                                │
                                   │  SQLite (users, settings,      │
                                   │          briefings, send_logs) │
                                   └────────────────────────────────┘
```

## 기술 스택

| 구분 | 선택 | 비고 |
|------|------|------|
| Frontend | Next.js 16 (App Router) + React 19.2 + TypeScript strict + pnpm | |
| UI | shadcn/ui + Tailwind 4 + Framer Motion + Sonner | v0.app 프로토타입 기반 |
| Backend | FastAPI + SQLAlchemy + SQLite | Python 3.11+ |
| LLM | Gemini 2.5 Flash Lite | 무료 티어, `response_mime_type=application/json` |
| News | Google News RSS | `feedparser`, 카테고리당 20건/24h |
| Clustering | scikit-learn TF-IDF + cosine similarity | threshold 0.6 |
| Scheduler | APScheduler | Day 3 예정 |
| TTS | Web Speech API | Day 3 예정 |

> 💡 **축소된 범위**: 원 설계에는 `Claude Haiku → Gemini Flash` 멀티모델 폴백과 `네이버 검색 API + NewsAPI + RSS` 다중 소스가 있었으나, 제출 시점 키 미발급으로 Gemini + RSS 단일 경로로 축소했습니다. 구조는 플러그인 방식이라 키 발급 시 Client/폴백 한 개씩만 추가하면 복원됩니다. 자세한 경위는 [`plan.md` 변경 이력](./plan.md#변경-이력) 참고.

## 프로젝트 구조

```
briefBot/
├── backend/                # FastAPI + 파이프라인
│   ├── main.py             # 앱 엔트리, CORS, lifespan
│   ├── config.py           # pydantic-settings
│   ├── models.py           # users/settings/briefings/send_logs
│   ├── schemas.py          # Pydantic 요청/응답
│   ├── routers/            # users, settings, briefings, send
│   ├── pipeline/           # collector, preprocessor, analyzer, service
│   └── prompts/            # extract, briefing, radio_script
├── frontend/               # Next.js 16 App Router
│   ├── app/
│   │   ├── page.tsx        # 온보딩 5단계
│   │   └── dashboard/
│   │       ├── page.tsx    # 대시보드 + "지금 브리핑 받기"
│   │       ├── briefing/[id]/page.tsx
│   │       └── settings/page.tsx
│   ├── components/         # onboarding/, dashboard/, briefing/, ui/
│   └── lib/                # types, api, storage, schedule, categories
├── plan.md                 # 설계 원본 (소스 오브 트루스)
├── CLAUDE.md               # 저장소 작업 가이드 (루트 인덱스)
└── README.md
```

하위 CLAUDE.md:
- [`backend/CLAUDE.md`](./backend/CLAUDE.md) — FastAPI 명령어, 파이프라인 3단 구조, LLM 제약
- [`frontend/CLAUDE.md`](./frontend/CLAUDE.md) — Next.js/shadcn 규약, 라우트, 상태 관리

## 실행 방법

### 1. 백엔드

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env 파일을 열어 GEMINI_API_KEY를 채워넣으세요 (https://ai.google.dev)
uvicorn main:app --reload --port 8000
```

- http://localhost:8000/docs 에서 Swagger UI 확인
- SQLite DB는 첫 실행 시 `backend/briefbot.db`에 자동 생성됨

### 2. 프론트엔드

```bash
cd frontend
pnpm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL이 백엔드 주소와 맞는지 확인
pnpm dev
```

- http://localhost:3000 에서 온보딩부터 시작
- 온보딩 5단계 완료 → `/dashboard` → "지금 브리핑 받기" 버튼 → 15~30초 후 카드 3~6개 생성

### 3. E2E 시연 시나리오

1. http://localhost:3000 접속 → 이름/이메일 입력
2. 관심 카테고리 선택(최소 1개) → 브리핑 시간 선택 → 채널 선택 → 완료
3. 자동으로 `/dashboard` 이동 → **"지금 브리핑 받기"** 클릭
4. 15~30초 후 카테고리별 카드 렌더링 → 카드 클릭 → 상세 페이지에서 요약/라디오 스크립트/분석/원문 링크 확인

## API 엔드포인트

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | `/api/users` | 유저 등록(이름 + 이메일) | ✅ |
| GET | `/api/users/{user_id}` | 유저 조회 | ✅ |
| PUT | `/api/settings/{user_id}` | 설정 upsert(카테고리/cron/채널) | ✅ |
| GET | `/api/settings/{user_id}` | 설정 조회 | ✅ |
| GET | `/api/briefings?user_id=&category=&limit=` | 브리핑 목록 | ✅ |
| GET | `/api/briefings/{briefing_id}` | 브리핑 상세 | ✅ |
| POST | `/api/briefings/generate?user_id={id}` | 즉시 생성(시연용) | ✅ |
| POST | `/api/send/{briefing_id}` | 수동 발송 | ⬜ Day 3 |
| GET | `/api/health` | 헬스 체크 | ✅ |

## 파이프라인 3단 구조

```
[Google News RSS]              카테고리별 쿼리, 24h/20건 컷
        │
        ▼
[Preprocessor]                 HTML/노이즈 제거
        │                      → TF-IDF + cosine (0.6) 클러스터링
        │                      → 대표 기사 2~3건 (최신순 + 출처 다양성)
        ▼
[GeminiAnalyzer — LLM 구간]
  ├─ Step1: JSON 추출 (topic, entities, core_fact, sentiment, importance)
  │         → 필수 필드 검증 + 재시도(최대 2회)
  ├─ Step2-A: 3줄 브리핑 (문어체)
  ├─ Step2-B: 라디오 스크립트 (구어체, 숫자 한글 변환)
  └─ 규칙 기반 중요도 재계산: LLM score × 0.7 + 기사 수 × 0.3
        │
        ▼
[SQLite briefings]             web 채널은 DB 저장으로 대체 완료
```

## 개발 현황 (2026-04-17 기준)

| 마일스톤 | 내용 | 상태 |
|---------|------|------|
| Day 1 (4/17 오전) | 백엔드 뼈대 + 파이프라인 E2E | ✅ |
| Day 2 (4/17 오후) | 프론트 4개 페이지 실 API 연동 | ✅ |
| Day 3 (4/19) | Slack/Email dispatcher + APScheduler + Web Speech API | ⬜ |
| Day 4 (4/20) | 시드 스크립트, 시연 리허설 | ⬜ |
| Day 5 (4/21) | 최종 점검 → 18:00 제출 | ⬜ |

검증 결과:
- `POST /api/briefings/generate` → Gemini 호출 후 실제 브리핑 3건 생성 확인
- `pnpm exec tsc --noEmit` pass
- `pnpm exec next build` pass (4 routes)
- API 스모크: `users.create` / `settings.save` / `briefings.list/get/generate` 정합 확인

## 설계 의사결정

- **왜 Gemini 단일?** Claude 키 미발급으로 멀티모델 체인 축소. analyzer는 여전히 `_call_with_retry()` 구조이므로 키 발급 시 한 줄 추가로 복원 가능.
- **왜 RSS만?** 네이버/NewsAPI 키 미발급. Client 클래스를 분리 설계했으므로 키 발급 시 신규 Client 추가만으로 확장.
- **왜 APScheduler?** 프로세스 내장으로 추가 인프라 불필요, 유저별 cron을 그대로 등록 가능.
- **왜 Web Speech API?** 비용 0, API 키 불필요. 프로덕션 확장 시 Google Cloud TTS / CLOVA Voice로 교체하도록 `audio_formatter` 레이어 분리.
- **왜 클러스터링을 코드로?** 임베딩 API 비용 절감 + LLM 토큰 절약. "코드가 할 수 있는 건 코드가 하고, 모델은 모델만 할 수 있는 일(자연어 이해/생성)에만 집중."

## 라이선스

서울신문 과제평가 제출용 프로토타입. 코드 재사용 시 별도 문의 바랍니다.
