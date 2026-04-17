# CLAUDE.md — frontend/

This file provides guidance to Claude Code when working in the **frontend/** directory.

## 개발 명령어

```bash
cd frontend
pnpm install                                       # 최초 1회
pnpm dev                                           # http://localhost:3000
pnpm lint                                          # ESLint
pnpm build                                         # 프로덕션 빌드
```

- **pnpm 필수** (lock 파일이 `pnpm-lock.yaml`). npm/yarn 섞어 쓰면 안 됨.
- API base URL은 `frontend/.env.local`의 `NEXT_PUBLIC_API_URL` (기본 `http://localhost:8000`).

## 폴더 이력

원래 v0.app이 생성한 이름은 `b_ydy857XxdS6`였으나 `frontend/`로 rename됨. 과거 커밋/이슈에서 옛 이름이 보이면 같은 폴더로 해석.

## 라우트 / 페이지 구조

- `/` (`app/page.tsx`) — 5단계 슬라이드 온보딩 (Welcome → Category → Schedule → Channel → Completion). Framer Motion 트랜지션.
- `/dashboard` (`app/dashboard/page.tsx`) — 카드 그리드 + 상단 라디오 플레이어 바 + 카테고리/날짜 필터.
- `/dashboard/briefing/[id]` — 상세 페이지 (요약, 라디오 스크립트, 분석, 출처 기사, 관련 브리핑 5섹션).
- `/dashboard/settings` — 카테고리/주기/채널/AI 모델 설정.

## 상태 관리 / API 연동

- **전역 상태 라이브러리 없음** (Context/Zustand/Redux 모두 미사용). 각 페이지가 `useState`로 로컬 상태만 관리.
- **현재 모든 데이터가 mock**: `app/dashboard/page.tsx`의 `mockBriefings`, `app/dashboard/briefing/[id]/page.tsx`의 `briefingData`. `lib/api.ts`는 아직 없음. **Day 2 과제: `lib/api.ts` + `lib/storage.ts` 추가하고 mock 제거.**
- 로그인 개념 없음 — `lib/storage.ts`(예정)에서 `localStorage`에 `briefbot_user_id` 저장하는 패턴.

## UI 라이브러리 / 스타일

- **shadcn/ui** (Radix UI 기반) — `components/ui/`에 60+ 컴포넌트 이미 설치됨. 새 컴포넌트는 `pnpm dlx shadcn@latest add <name>`. 설정(`components.json`): `style: new-york`, `baseColor: neutral`, CSS variables 활성화, 아이콘은 `lucide-react`.
- **Tailwind 4** + OKLCH 컬러 변수 (`styles/globals.css`), **다크모드 기본**. CSS-in-JS 없음. 클래스 병합은 `lib/utils.ts`의 `cn()` (clsx + tailwind-merge).
- **Framer Motion** — 온보딩/카드 호버 등 애니메이션 표준.
- **Sonner** — 토스트 (`hooks/use-toast.ts` 래퍼).
- 폼은 `react-hook-form` + `zod` (이미 의존성 설치됨).

## 컴포넌트 분류

- `components/ui/` — shadcn/ui (수정 자제, 필요 시 wrapper 작성).
- `components/onboarding/` — 5-step 페이지 컴포넌트.
- `components/dashboard/` — `dashboard-header`, `radio-player-bar`, `briefing-grid`, `quick-actions`.
- `components/briefing/` — 상세 페이지의 5개 섹션 컴포넌트.

## 규약

- 모든 페이지/컴포넌트는 `"use client"` 사용 (RSC 미사용 — v0.app 생성 기조 유지).
- UI 텍스트는 한국어 (서울신문 과제 대상). 코드 식별자/주석은 영어.
- 새 도메인 컴포넌트는 분류별 하위 폴더(onboarding/dashboard/briefing)에 추가, 공통 UI는 `components/ui/` 외부에 두지 말 것.
- 백엔드 응답 타입은 `backend/schemas.py`(Pydantic)와 1:1 매핑되어야 함 (Day 2에 `lib/api.ts`로 정형화 예정).
