# BriefBot Day 1~2 갭 분석 리포트

- **분석 대상**: BriefBot Day 1 백엔드 + Day 2 프론트엔드 E2E
- **설계 문서**: `plan.md` (§2, §4, §5, §7, §8, §9, §12)
- **분석 일자**: 2026-04-17
- **Overall Match Rate (Day 1~2 스코프)**: **94%** → Day 3 착수 가능

## 점수표

| 카테고리 | 점수 | 상태 |
|---|---:|---|
| Day 1~2 범위 설계-구현 일치 | 92% | 거의 일치 |
| DB 스키마 정합 (§7) | 100% | 완전 일치 |
| API 엔드포인트 정합 (§8) | 100% | 완전 일치 |
| 파이프라인 3단 (§5) | 88% | 중요도 공식 편차 |
| 프론트 타입 ↔ 백엔드 정합 | 98% | 거의 일치 |

Day 3~4 예정 범위(dispatcher, scheduler, seed, Web Speech)는 `§9`/`§10`에서 이미 ⬜로 표기되어 갭 집계에서 제외.

## Critical (Day 3 착수 전 선결) — 1건

### C-1. `backend/config.py:9` — `GEMINI_MODEL` 기본값 설계와 불일치 ✅ 수정 완료
- 설계: `gemini-2.5-flash-lite` (plan.md §2, §12 변경 이력, backend/CLAUDE.md "LLM 모델 제약")
- 구현(수정 전): `gemini-2.0-flash` — 이 프로젝트 무료 티어 한도가 `limit: 0`.
- 영향: `.env` 없이 배포/CI 시 즉시 429 → 파이프라인 전체 실패.
- **조치**: `gemini-2.5-flash-lite`로 수정함.

## Major — 2건

### M-1. `backend/pipeline/analyzer.py:150-158` — 중요도 재계산 공식 편차
- 설계(§5.3): `LLM score × 0.7 + 기사 수 가중치 × 0.3`
- 구현: `base × 0.7 + bonus(min(2.0, (cluster_size-1)*0.3)) + 1.5`
- 영향: 고정 `+1.5` 오프셋 때문에 실제 분포가 상향됨. 낮은 중요도가 실질적으로 2점대에서 시작.
- 조치: 코드 또는 plan.md §5.3 중 택일 — Day 3 Task에 포함.

### M-2. `frontend/components/dashboard/radio-player-bar.tsx` — 카테고리 진행 상황 하드코딩
- `categoryProgress`가 모듈 최상위 상수. 실제 브리핑과 무관.
- 조치: Day 3 Web Speech 연동 시 `briefings` prop으로 동적 렌더.

## Minor — 4건

| ID | 위치 | 내용 |
|---|---|---|
| m-1 | `backend/main.py` | 로깅 basicConfig 없음 → 시연 전 INFO 레벨 설정 |
| m-2 | `backend/models.py:14,28,29,46,59` | `datetime.utcnow` deprecated (3.12+) |
| m-3 | `backend/routers/users.py:11-20` | `POST /api/users`가 이메일 기준 idempotent — plan.md §8에 한 줄 기록 권장 |
| m-4 | `frontend/app/page.tsx`, `dashboard/settings/page.tsx` | 카테고리 ID 하드코딩 중복 → `lib/categories.ts`에 `CATEGORY_OPTIONS` 단일화 권장 |

## 체크 결과 요약

- ✅ DB 스키마 §7과 1:1 일치
- ✅ 파이프라인 3단(수집/전처리/분석) §5 일치 (M-1 공식만 편차)
- ✅ API 시그니처 §8 일치 (`POST /api/briefings/generate?user_id=`, `PUT /api/settings/{user_id}` upsert)
- ✅ `lib/api.ts`·`lib/types.ts`·`lib/categories.ts` 타입 정합
- ✅ 4개 페이지 mock 제거 + 실 API 연동
- ✅ "지금 브리핑 받기" 버튼(`quick-actions.tsx`) `api.briefings.generate`에 연결

## Day 3 Task 착수 기준

Critical 1건 해소(C-1 수정 완료) → **Day 3 착수 가능**.

Day 3 범위(dispatcher + scheduler + Web Speech)에 M-1·M-2를 묶어서 처리.
