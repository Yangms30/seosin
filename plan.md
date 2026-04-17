# BriefBot — AI 이슈 브리핑 시스템
## 서울신문 과제평가 아키텍처 문서

> 최종 업데이트: 2026-04-17
> 상태: **Day 1 백엔드 파이프라인 + Day 2 프론트 연동 완료 (E2E 동작 확인)**

---

## 1. 프로젝트 개요

### 과제 요약
공개 API, 검색도구 등을 활용하여 국내외 주요 이슈를 실시간으로 수집/분석하고, 특정 채널(Slack, 웹페이지, 이메일)을 통해 자동으로 보고하는 AI 기반 프로토타입

### 서비스 한 줄 정의
**"가벼운 LLM으로도 똑똑하게 — 파이프라인 엔지니어링으로 뉴스를 분석하고 자동 브리핑하는 시스템"**

### 핵심 차별화 전략
1. **프롬프트 엔지니어링** — 복잡한 태스크를 단순 태스크로 분해, 각 단계에 전문화된 프롬프트
2. **컨텍스트 엔지니어링** — 모델에 넘기기 전 컨텍스트를 정제하여 경량 모델의 성능 극대화
3. **하네스 엔지니어링** — 검증 레이어, 폴백 체인, 규칙 기반 보정으로 모델 바깥에서 품질 보장
4. **라디오 모드** — 텍스트 브리핑을 구어체 스크립트로 변환 + TTS 재생, "읽는 뉴스"에서 "듣는 뉴스"로 확장

---

## 2. 기술 스택

| 구분 | 선택 | 버전/비고 | 현재 상태 |
|------|------|-----------|-----------|
| **Frontend** | Next.js 16 (App Router) | React 19.2 / TS strict / pnpm | ✅ 구현 완료 |
| **UI** | shadcn/ui + Tailwind 4 + Framer Motion + Sonner | v0.app 프로토타입 기반 | ✅ 연동 완료 |
| **Backend** | FastAPI | Python 3.11+ / uvicorn | ✅ 구현 완료 |
| **Database** | SQLite + SQLAlchemy | 로컬 환경, 별도 DB 서버 불필요 | ✅ 구현 완료 |
| **LLM (메인)** | Gemini 2.5 Flash Lite | `gemini-2.5-flash-lite`, 무료 티어 | ✅ 구현 완료 |
| **LLM (폴백)** | ~~Claude Haiku 4.5~~ (미발급으로 보류) | 키 발급 시 추가 예정 | ⬜ 미적용 |
| **스케줄러** | APScheduler | FastAPI 프로세스 내장 | ⬜ Day 3 예정 |
| **뉴스 소스** | Google News RSS (단일) | `feedparser`, 카테고리당 20건/24h | ✅ 구현 완료 |
| **~~네이버/NewsAPI~~** | (키 미발급으로 보류) | 추후 확장 포인트 | ⬜ 미적용 |
| **이메일 발송** | SMTP (Gmail) 또는 Resend | 로컬 테스트용 | ⬜ Day 3 예정 |
| **Slack 발송** | Incoming Webhook | 무료 | ⬜ Day 3 예정 |
| **TTS (라디오)** | Web Speech API (브라우저 내장) | 비용 0, API 키 불필요 | ⬜ Day 3 예정 (스크립트는 생성됨) |

---

## 3. API 키 발급 현황

| API | 발급 URL | 무료 한도 | 발급 상태 |
|-----|----------|-----------|-----------|
| Gemini API (`gemini-2.5-flash-lite`) | ai.google.dev | 무료 티어 | ✅ 발급 + 적용 완료 |
| Claude API (Haiku 4.5) | platform.claude.com | Pay-as-you-go (~$1-2 예상) | ⬜ 미발급 (폴백 미적용) |
| 네이버 검색 API | ncloud.com | 25,000건/일 | ⬜ 미발급 (RSS로 대체) |
| NewsAPI.org | newsapi.org/register | 100건/일 | ⬜ 미발급 (RSS로 대체) |
| Google News RSS | (키 불필요) | 무제한 | ✅ 바로 사용 가능 — **유일한 소스로 채택** |

> 💡 **변경 사항**: 본래 `Claude Haiku (메인) → Gemini Flash (폴백)` 멀티모델 체인이었으나 Claude 키 미발급으로 `Gemini 2.5 Flash Lite 단일 모델`로 축소. 추후 Claude 발급 시 analyzer의 `_call_with_retry()`에 폴백 체인 복원 예정.

---

## 4. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ 온보딩    │  │ 대시보드      │  │ 브리핑 상세 뷰    │  │
│  │ (카테고리 │  │ (카드 리스트  │  │ (전문 + 원문링크) │  │
│  │  채널설정)│  │  즉시발송 등) │  │                   │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              API Layer (Router)                   │    │
│  │  /api/briefings    — 브리핑 조회/즉시생성        │    │
│  │  /api/settings     — 유저 설정 CRUD              │    │
│  │  /api/send         — 수동 발송 트리거            │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │           News Pipeline (핵심)                    │    │
│  │                                                   │    │
│  │  [Collector]                                      │    │
│  │   ├─ NaverNewsClient  (네이버 검색 API)          │    │
│  │   ├─ NewsAPIClient    (NewsAPI.org)               │    │
│  │   └─ GoogleRSSClient  (Google News RSS)           │    │
│  │          │                                        │    │
│  │          ▼                                        │    │
│  │  [Preprocessor]                                   │    │
│  │   ├─ 중복 제거 (제목 유사도)                      │    │
│  │   ├─ 본문 정제 (광고/노이즈 제거)                │    │
│  │   └─ 클러스터링 (TF-IDF + 코사인 유사도)         │    │
│  │          │                                        │    │
│  │          ▼                                        │    │
│  │  [Analyzer] — LLM 호출 구간                       │    │
│  │   ├─ Step1: 구조화 추출 (JSON)                    │    │
│  │   ├─ Validator: 출력 검증 + 자동 재시도           │    │
│  │   ├─ Step2: 브리핑 생성                           │    │
│  │   └─ Fallback: 1차모델 실패 → 2차모델            │    │
│  │          │                                        │    │
│  │          ▼                                        │    │
│  │  [Formatter]                                      │    │
│  │   ├─ WebFormatter   (HTML 카드)                   │    │
│  │   ├─ SlackFormatter (Markdown + Block Kit)        │    │
│  │   ├─ EmailFormatter (HTML 템플릿)                 │    │
│  │   └─ AudioFormatter (라디오 스크립트 생성)        │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │           Dispatcher (발송)                       │    │
│  │   ├─ SlackSender   (Webhook)                      │    │
│  │   ├─ EmailSender   (SMTP / Resend)                │    │
│  │   └─ WebPusher     (DB 저장 → 프론트 조회)       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Scheduler (APScheduler)                 │    │
│  │   — 유저별 설정된 시간에 파이프라인 자동 실행     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Database (SQLite)                       │    │
│  │   — users, settings, briefings, send_logs         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 뉴스 파이프라인 상세 (핵심)

### 5.1 수집 (Collector)

| 소스 | 용도 | 호출 방식 | 구현 상태 |
|------|------|-----------|-----------|
| Google News RSS | 국내외 통합 (유일 소스) | `https://news.google.com/rss/search?q=...&hl=ko&gl=KR&ceid=KR:ko` → feedparser | ✅ 완료 (`pipeline/collector.py`) |
| ~~네이버 검색 API~~ | 국내 뉴스 | Client ID/Secret 미발급으로 보류 | ⬜ 확장 포인트 |
| ~~NewsAPI.org~~ | 해외 뉴스 | API Key 미발급으로 보류 | ⬜ 확장 포인트 |

- 카테고리별 키워드 매핑: `{"정치": "정치", "경제": "한국 경제 OR 금리", "사회": "사회", "국제": "국제", "스포츠": "스포츠", "IT/과학": "IT 과학"}`
- 수집량: 카테고리당 최대 20건, 발행일 기준 최근 24시간 필터
- 수집 주기: 스케줄러 트리거 시 (Day 3 예정) 또는 즉시 생성 API 호출 시

### 5.2 전처리 (Preprocessor) — LLM 호출 없음, 코드로 처리

```
[수집된 기사 목록]
     │
     ▼
(1) 제목 기반 중복 제거 — 자카드 유사도 or TF-IDF 코사인 유사도
     │
     ▼
(2) 본문 정제 — 광고, 관련기사 링크, 기자 정보 등 노이즈 제거
     │
     ▼
(3) 클러스터링 — TF-IDF 벡터화 → 코사인 유사도 → 임계값 기반 그룹핑
     │
     ▼
(4) 클러스터별 대표 기사 2~3건 선정 (최신순 + 소스 다양성)
     │
     ▼
[정제된 컨텍스트] → Analyzer로 전달
```

**설계 원칙:** "코드가 할 수 있는 건 코드가 하고, 모델은 모델만 할 수 있는 일(자연어 이해/생성)에만 집중"

### 5.3 분석 (Analyzer) — LLM 호출 구간

#### Step 1: 구조화 추출
```
입력: 클러스터별 대표 기사 2~3건 (정제된 텍스트)
프롬프트: "아래 뉴스 기사를 읽고, JSON 형식으로 추출하세요:
          {topic, key_entities, core_fact, sentiment, importance_score(1-10)}.
          추가 의견 없이 JSON만 출력하세요."
출력: 구조화된 JSON
검증: JSON 파싱 가능 여부 + 필수 필드 존재 확인 → 실패 시 재시도(최대 2회)
```

#### Step 2-A: 텍스트 브리핑 생성
```
입력: Step 1에서 추출된 구조화 데이터 + Few-shot 예시
프롬프트: "당신은 언론사 데스크입니다. 아래 구조화된 이슈 데이터를 바탕으로
          3줄 브리핑을 작성하세요.
          첫 줄: 핵심 팩트 / 둘째 줄: 왜 중요한지 / 셋째 줄: 향후 전망"
출력: 자연어 브리핑 텍스트
```

#### Step 2-B: 라디오 스크립트 생성 (NEW)
```
입력: Step 2-A의 텍스트 브리핑 + 카테고리 정보
프롬프트: "당신은 뉴스 라디오 앵커입니다. 아래 브리핑을 자연스러운 구어체 라디오
          스크립트로 변환하세요.
          - 듣는 사람이 이해하기 쉽게 풀어서 설명
          - 숫자/약어는 읽기 쉬운 형태로 변환 (예: 0.25%p → 영점이오 퍼센트포인트)
          - 카테고리 간 자연스러운 연결 멘트 포함
          - 전체 길이: 30초~1분 분량"
출력: 구어체 라디오 스크립트
```

**텍스트 vs 라디오 톤 차이 예시:**
```
텍스트: "한국은행이 기준금리를 0.25%p 인하하여 2.75%로 결정했다."
라디오: "오늘 한국은행이 기준금리를 내렸습니다. 영점이오 퍼센트포인트 인하해서
        이점칠오 퍼센트가 됐는데요, 이게 왜 중요하냐면..."
```

#### 하네스 엔지니어링 적용 (구현됨)
- **Validator:** Step1 출력 JSON 파싱 + 필수 필드(`topic`, `key_entities`, `core_fact`, `sentiment`, `importance_score`) 검증 → 실패 시 `_call_with_retry()`로 최대 `LLM_MAX_RETRIES=2` 재시도 (`pipeline/analyzer.py`)
- **Fallback Chain:** 원래 `Claude Haiku → Gemini Flash` 설계였으나 Claude 키 미발급으로 현재는 `Gemini 2.5 Flash Lite` 단일. 실패 시 해당 클러스터 스킵 후 다음 클러스터로 진행 (부분 성공 허용)
- **규칙 기반 보정:** `_recompute_importance()` — LLM `importance_score × 0.7 + 클러스터 기사 수 가중치 × 0.3`
- **병렬 처리:** 카테고리별 `asyncio.gather` (무료 티어 rate limit 고려 동시 6개 이하)
- **JSON 강제:** Gemini `response_mime_type="application/json"` 옵션 사용으로 Markdown 코드블록 오염 방지

### 5.4 포맷팅 (Formatter)

| 채널 | 포맷 | 비고 |
|------|------|------|
| 웹 | HTML 카드 UI | Next.js 컴포넌트로 렌더링 |
| Slack | Markdown + Block Kit JSON | Webhook 전송 |
| 이메일 | HTML 템플릿 | 반응형 이메일 레이아웃 |
| 라디오 | 구어체 스크립트 → Web Speech API (TTS) | 브라우저 내장, 비용 0 |

### 5.5 라디오 모드 상세 (NEW)

#### 구현 방식
- **1차 (프로토타입):** 브라우저 내장 Web Speech API (`speechSynthesis`) — 비용 0, API 키 불필요
- **2차 (확장):** Google Cloud TTS 또는 Naver CLOVA Voice — 더 자연스러운 음성 (발표에서 "확장 포인트"로 언급)

#### UI 구성
```
┌─────────────────────────────────────────────────────┐
│  🎧 라디오 모드                                      │
│                                                     │
│  ▶ 오늘의 브리핑 전체 듣기         ──○───── 3:42 / 8:15 │
│    정치 ✓ → 경제 (재생 중) → 스포츠 → IT            │
│                                                     │
│  [⏮] [⏸] [⏭]    🔊 ━━━━━━○━━━ 볼륨               │
└─────────────────────────────────────────────────────┘
```

#### 기능
- 개별 브리핑 재생: 카드별 ▶ 버튼
- 전체 연속 재생: 대시보드 상단 "오늘의 브리핑 전체 듣기"
- 카테고리 간 자연스러운 연결 멘트 (LLM이 생성)
- 재생/일시정지/다음 카테고리 건너뛰기 컨트롤

#### 면접 어필 포인트
> "같은 데이터를 채널 특성에 맞게 다른 톤으로 생성합니다. 텍스트 브리핑은 문어체로, 라디오 스크립트는 구어체로 — 이것이 프롬프트 엔지니어링의 힘입니다."

---

## 6. 유저 플로우

```
첫 진입 (로그인 없이, 이름 + 이메일만 입력)
    │
    ▼
관심 카테고리 선택 (정치, 경제, 사회, 국제, 스포츠, IT/과학)
    │
    ▼
보고 주기 설정 (매일 아침 8시, 점심 12시, 실시간 등)
    │
    ▼
채널 선택
  ├─ 웹: 기본 (대시보드에서 확인)
  ├─ 이메일: 이메일 주소 입력
  └─ Slack: Webhook URL 입력
    │
    ▼
대시보드 진입
  ├─ 최신 브리핑 카드 리스트
  ├─ "지금 브리핑 받기" 버튼 (면접 시연용)
  ├─ 🎧 라디오 모드 (전체 듣기 / 개별 듣기)
  └─ 브리핑 히스토리
```

---

## 7. DB 스키마

```sql
-- 유저 (간단 등록)
CREATE TABLE users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 유저별 설정
CREATE TABLE settings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    categories      TEXT NOT NULL,       -- JSON: ["정치","경제","스포츠"]
    schedule_cron   TEXT,                -- cron 표현식: "0 8 * * *"
    channels        TEXT NOT NULL,       -- JSON: {"web":true,"slack":"webhook_url","email":"user@email.com"}
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 브리핑 결과
CREATE TABLE briefings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL REFERENCES users(id),
    category          TEXT NOT NULL,
    title             TEXT NOT NULL,
    summary           TEXT NOT NULL,      -- 3줄 브리핑 (텍스트)
    radio_script      TEXT,               -- 라디오용 구어체 스크립트
    source_articles   TEXT,               -- JSON: [{title, url, source}]
    importance_score  REAL,
    raw_analysis      TEXT,               -- LLM Step1 JSON 원본
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 발송 로그
CREATE TABLE send_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    briefing_id  INTEGER NOT NULL REFERENCES briefings(id),
    channel      TEXT NOT NULL,          -- "web" | "slack" | "email"
    status       TEXT NOT NULL,          -- "success" | "failed"
    error_msg    TEXT,
    sent_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. API 엔드포인트

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | `/api/users` | 유저 등록 (이름 + 이메일) | ✅ |
| GET | `/api/users/{user_id}` | 유저 정보 조회 | ✅ |
| PUT | `/api/settings/{user_id}` | 유저 설정 저장/수정 (upsert) | ✅ |
| GET | `/api/settings/{user_id}` | 유저 설정 조회 | ✅ |
| GET | `/api/briefings?user_id=&category=&limit=` | 브리핑 목록 조회 (유저별, 카테고리 필터, 최신순) | ✅ |
| GET | `/api/briefings/{briefing_id}` | 브리핑 상세 조회 | ✅ |
| POST | `/api/briefings/generate?user_id={id}` | 즉시 브리핑 생성 (시연용, 동기 실행) | ✅ |
| POST | `/api/send/{briefing_id}` | 특정 브리핑 수동 발송 (라우터 뼈대 존재) | ⬜ Day 3 |
| GET | `/api/health` | 헬스 체크 | ✅ |

> 💡 설계 원본의 `POST /api/settings` + `PUT /api/settings/{id}` 조합은 "upsert 한 방"이 더 단순하여 `PUT /api/settings/{user_id}` 단일 엔드포인트로 통합.

---

## 9. 프로젝트 디렉토리 구조

```
briefBot/
├── backend/                            ✅ Day 1 완료
│   ├── main.py                         # FastAPI 앱, CORS, 4개 라우터 등록, lifespan create_all
│   ├── config.py                       # pydantic-settings (@lru_cache get_settings)
│   ├── database.py                     # SQLAlchemy engine/session, Base
│   ├── models.py                       # User, Setting, Briefing, SendLog
│   ├── schemas.py                      # Pydantic 요청/응답 모델
│   ├── routers/
│   │   ├── users.py                    ✅ POST /api/users, GET /api/users/{id}
│   │   ├── settings.py                 ✅ PUT/GET /api/settings/{user_id}
│   │   ├── briefings.py                ✅ GET list/detail, POST /generate
│   │   └── send.py                     ⬜ 뼈대만 존재, Day 3에 구현
│   ├── pipeline/
│   │   ├── collector.py                ✅ GoogleRSSClient (feedparser)
│   │   ├── preprocessor.py             ✅ TF-IDF + 코사인 유사도 클러스터링 (threshold 0.6)
│   │   ├── analyzer.py                 ✅ GeminiAnalyzer (Step1 추출 + Step2A 브리핑 + Step2B 라디오)
│   │   └── service.py                  ✅ generate_briefings_for_user(db, user_id) 오케스트레이션
│   ├── prompts/
│   │   ├── extract.py                  ✅ Step1 JSON 추출 프롬프트
│   │   ├── briefing.py                 ✅ Step2-A 3줄 브리핑 프롬프트
│   │   └── radio_script.py             ✅ Step2-B 구어체 라디오 스크립트 프롬프트
│   ├── dispatcher/                     ⬜ Day 3 예정 (slack.py, email_sender.py, web.py)
│   ├── scheduler.py                    ⬜ Day 3 예정
│   ├── scripts/seed.py                 ⬜ Day 4 예정
│   ├── briefbot.db                     # 실행 시 자동 생성
│   ├── .env, .env.example
│   ├── requirements.txt
│   └── CLAUDE.md                       # 백엔드 전용 개발 가이드
├── frontend/                           ✅ Day 2 완료 (v0.app 프로토타입 → 실 API 연동)
│   ├── app/
│   │   ├── layout.tsx                  ✅ Sonner Toaster 마운트
│   │   ├── page.tsx                    ✅ 온보딩 5단계 (Welcome → Category → Schedule → Channel → Completion)
│   │   └── dashboard/
│   │       ├── page.tsx                ✅ 실제 API 연동, "지금 브리핑 받기" 버튼, 빈 상태 처리
│   │       ├── briefing/[id]/page.tsx  ✅ getBriefing 연동 + 관련 브리핑
│   │       └── settings/page.tsx       ✅ 설정 로드/저장 + 로그아웃/초기화
│   ├── components/
│   │   ├── onboarding/
│   │   │   ├── welcome-step.tsx        (이름/이메일)
│   │   │   ├── category-step.tsx       (6개 카테고리 ID 선택)
│   │   │   ├── schedule-step.tsx       (morning/noon/evening/custom)
│   │   │   ├── channel-step.tsx        (web/email/slack + webhook)
│   │   │   └── completion-step.tsx     ✅ createUser → saveSettings → /dashboard
│   │   ├── dashboard/
│   │   │   ├── dashboard-header.tsx
│   │   │   ├── radio-player-bar.tsx    ⬜ Day 3에 Web Speech API 연동
│   │   │   ├── quick-actions.tsx       ✅ onGenerate/generating props
│   │   │   └── briefing-grid.tsx       ✅ Briefing 타입 직접 소비
│   │   └── briefing/
│   │       ├── briefing-header.tsx
│   │       ├── summary-section.tsx
│   │       ├── radio-script-section.tsx
│   │       ├── analysis-section.tsx
│   │       ├── source-articles-section.tsx
│   │       └── related-briefings.tsx
│   ├── lib/
│   │   ├── types.ts                    ✅ 백엔드 schemas.py와 1:1 매핑
│   │   ├── api.ts                      ✅ request 래퍼 + BriefBotApiError + 네임스페이스 API
│   │   ├── storage.ts                  ✅ SSR-safe localStorage (briefbot_user_id)
│   │   ├── schedule.ts                 ✅ SchedulePreset → cron 변환
│   │   ├── categories.ts               ✅ 카테고리 ID ↔ 한글 매핑
│   │   └── briefing-display.ts         ✅ 포맷터 (badge class, 상대 시간, 출처 라벨, 중요도)
│   ├── .env.local, .env.example        ✅ NEXT_PUBLIC_API_URL=http://localhost:8000
│   └── CLAUDE.md                       # 프론트 전용 개발 가이드
├── plan.md                             # 이 문서 (설계 소스 오브 트루스)
├── CLAUDE.md                           # 루트 가이드 (하위 CLAUDE.md로 위임)
└── docs/
```

---

## 10. 개발 일정 (D-6)

| 날짜 | 할 일 | 산출물 | 상태 |
|------|-------|--------|------|
| **4/15 (화)** | 아키텍처 확정 | 이 문서 | ✅ |
| **4/16 (수)** | v0.app UI 프로토타입 수령 | `frontend/` (mock 기반) | ✅ |
| **4/17 오전 (목, Day 1)** | 폴더 재배치 + FastAPI 뼈대 + 수집/전처리/LLM 분석 파이프라인 + DB 저장 + E2E | `backend/` 전체, `gemini-2.5-flash-lite` 적용, `curl POST /api/briefings/generate`로 실제 3건 생성 확인 | ✅ |
| **4/17 오후 (목, Day 2)** | mock 제거 + `lib/{types,api,storage,schedule,categories,briefing-display}.ts` 추가 + 온보딩/대시보드/상세/설정 4개 페이지 실 API 연동 + Sonner toast + `tsc --noEmit` + `next build` 통과 + API E2E 스모크 테스트 | `frontend/lib/*`, `app/**/*`, `components/dashboard/**` 전면 수정 | ✅ |
| **4/19 (토, Day 3)** | Slack/이메일 dispatcher + APScheduler + 라디오 바 Web Speech API 연동 | `dispatcher/`, `scheduler.py`, `radio-player-bar.tsx` 수정 | ⬜ |
| **4/20 (일, Day 4)** | 시드 스크립트, README, 시연 리허설, 에러 케이스 핸들링 | `scripts/seed.py`, `README.md`, 데모 영상 | ⬜ |
| **4/21 (월)** | 최종 점검 → 18:00까지 제출 | GitHub 링크 or 압축파일 | ⬜ |

**Day 1–2 검증 결과 (2026-04-17 기준)**
- `curl POST /api/briefings/generate?user_id=1` → Gemini 호출로 실제 브리핑 3건 생성, SQLite 저장, `radio_script` 포함
- `pnpm exec tsc --noEmit` → pass (0 errors)
- `pnpm exec next build` → pass, 4 routes (`/`, `/dashboard`, `/dashboard/briefing/[id]`, `/dashboard/settings`)
- API 스모크: `users.create` / `users.get` / `settings.save` / `settings.get` / `briefings.list` / `briefings.get` 모두 프론트 타입과 정합 확인 (테스트 포트 8765 — 메인 머신 8000에 SmartProp 백엔드가 상주)

---

## 11. 면접 발표 키 포인트 (메모)

### 킬 메시지
> "가벼운 모델의 한계를 알고 있기 때문에, 모델한테 다 맡기지 않고 **코드가 할 수 있는 건 코드가 하고, 모델은 모델만 할 수 있는 일(자연어 이해/생성)에만 집중**시켰습니다"

### 어필 포인트
- 프롬프트/컨텍스트/하네스 엔지니어링 3단 구조
- 멀티모델 폴백 (Claude Haiku → Gemini Flash)
- 다중 소스 수집 (네이버 + NewsAPI + Google RSS)
- 채널 추상화 (웹/Slack/이메일 3채널 지원)
- 라디오 모드 — 같은 데이터를 채널 특성에 맞게 다른 톤으로 생성 (프롬프트 엔지니어링 활용 사례)
- 기자 관점 분석 기능 (서울신문 맞춤)

### 예상 질문 대비
- Q: 왜 이 모델을 선택했나? → Haiku는 빠르고 저렴, 요약에 강함. Flash는 무료 폴백.
- Q: 실시간성은 어떻게 보장? → 스케줄러 + 즉시 생성 API 이중 구조
- Q: 클러스터링을 왜 코드로? → 임베딩 API 비용 절감 + LLM 토큰 절약
- Q: 확장성은? → 수집 소스 추가 = 새 Client 클래스만 구현, 채널 추가도 동일
- Q: 라디오 모드 TTS 품질은? → 프로토타입은 Web Speech API(비용 0), 프로덕션은 Google Cloud TTS / CLOVA Voice로 확장 설계

---

## 12. 자격증 (Resume용)

**Certifications**
- Engineer Big Data Analysis — Korea Data Agency (KData)
- AICE (AI Certificate for Everyone) — KT
- SW Development Level 5 (NCS) — HRDKorea

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-04-15 | 초안 작성 — 아키텍처, 기술 스택, 파이프라인, 일정 |
| 2026-04-16 | 라디오 모드 추가 — TTS 재생, 구어체 스크립트 생성, AudioFormatter, RadioPlayer |
| 2026-04-17 | **Day 1 (백엔드) 완료** — `b_ydy857XxdS6/` → `frontend/` rename, `backend/` 신규 생성. FastAPI 앱 + SQLAlchemy 모델(users/settings/briefings/send_logs) + pydantic schemas + 4개 라우터 완성. Google News RSS 단일 소스 수집기(`feedparser`, 24h/20건 컷), TF-IDF + 코사인 유사도(0.6) 클러스터링 전처리, Gemini `gemini-2.5-flash-lite` 기반 Step1 JSON 추출 + Step2-A 3줄 브리핑 + Step2-B 라디오 스크립트 LLM 하네스(재시도 2회, `response_mime_type=application/json`, 중요도 재계산). `POST /api/briefings/generate`로 E2E 동작(실제 브리핑 3건 생성) 확인. |
| 2026-04-17 | **Day 2 (프론트) 완료** — `lib/types.ts`(백엔드 schemas와 1:1), `lib/api.ts`(AbortController 타임아웃 + `BriefBotApiError` + 네임스페이스 API), `lib/storage.ts`(SSR-safe localStorage), `lib/schedule.ts`(preset→cron), `lib/categories.ts`(ID↔한글), `lib/briefing-display.ts`(포맷터) 신규. `app/layout.tsx`에 Sonner Toaster 마운트. 온보딩 `CompletionStep`을 `createUser → saveSettings → setUserId → /dashboard` 오케스트레이션으로 전환. 대시보드 `mockBriefings` 제거, 실 API `list/generate` 연동, "지금 브리핑 받기" 버튼에 `toast.promise` 바인딩. 브리핑 상세 `getBriefing` + 같은 카테고리 관련 브리핑. 설정 페이지는 기존 설정 로드/저장/초기화 + 포트 8000 이슈로 포트 변경도 대응 가능. `tsc --noEmit` pass, `next build` pass(4 routes). |
| 2026-04-17 | **기술 스택 축소 반영** — API 키 미발급 상황으로 `Claude Haiku (메인) → Gemini Flash (폴백)` 멀티모델 체인을 `Gemini 2.5 Flash Lite 단일`로 축소. `네이버 검색 API + NewsAPI.org + Google News RSS` 다중 소스를 `Google News RSS 단일`로 축소. 이들은 분석/하네스 구조를 훼손하지 않는 "소스/모델 차원의 축소"이므로 키 발급 시 Client/폴백 한 개씩만 추가하면 복원 가능 — 플러그인 구조는 유지됨. |
| 2026-04-17 | **아키텍처 보조 정리** — `CLAUDE.md`를 루트(인덱스 역할) + `backend/CLAUDE.md` + `frontend/CLAUDE.md` 3개로 분리(토큰 절감). `routers/send.py`는 Day 3 구현 예정으로 표시. `POST /api/settings` + `PUT /api/settings/{id}` 조합을 `PUT /api/settings/{user_id}` 단일 upsert로 통합. |