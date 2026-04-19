"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Loader2, Sparkles } from "lucide-react"
import type { GenerateProgressEvent } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  events: GenerateProgressEvent[]
  isRunning: boolean
}

const MAX_VISIBLE = 5

export function GenerationProgressPanel({ events, isRunning }: Props) {
  if (events.length === 0 && !isRunning) return null

  const latest = events[events.length - 1]
  const totals = progressTotals(events)
  const visible = events.slice(-MAX_VISIBLE)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Sparkles className="w-4 h-4 text-primary" />
          )}
          <span>리포트 생성 진행 상황</span>
        </div>
        {totals.total > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {totals.completed}/{totals.total} 분야
          </span>
        )}
      </header>

      {totals.total > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, (totals.completed / totals.total) * 100)}%`,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      )}

      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {visible.map((ev, idx) => {
            const isLatest = isRunning && ev === latest
            return (
              <motion.li
                key={`${ev.type}-${idx}-${visible.length}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex items-start gap-2 text-sm leading-snug",
                  isLatest
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {isLatest ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary/60" />
                  )}
                </span>
                <span className="whitespace-pre-wrap">{renderEvent(ev)}</span>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </motion.div>
  )
}

function renderEvent(ev: GenerateProgressEvent): string {
  switch (ev.type) {
    case "start":
      return `${ev.categories.length}개 분야 리포트 준비를 시작합니다…`
    case "category_start":
      return `[${ev.index}/${ev.total}] ${ev.category} 소식을 살펴봅니다…`
    case "collected":
      return `${ev.category} 기사 ${ev.count}건 수집 완료`
    case "clustered":
      return `${ev.category} 기사 클러스터 ${ev.count}개로 정리`
    case "summarizing_article":
      return `${ev.category} 기사 요약 중 (${ev.article_index}/${ev.article_total}): "${truncate(ev.article_title, 40)}"`
    case "synthesizing_radio":
      return `${ev.category} 분야 라디오 스크립트 생성 중…`
    case "category_done":
      return `✓ ${ev.category} 완료 (기사 ${ev.articles}건)`
    case "done":
      return `전체 완료! ${ev.generated}개 분야 리포트가 생성됐습니다.`
    case "dispatching":
      return ev.channels.length > 0
        ? `${ev.channels.join(", ")} 채널로 발송 중…`
        : "활성화된 외부 채널이 없어 발송을 건너뜁니다."
    case "dispatched": {
      if (ev.results.length === 0) return "외부 채널 발송 생략"
      const ok = ev.results
        .filter((r) => r.status === "success")
        .map((r) => r.channel)
      const fail = ev.results.filter((r) => r.status !== "success")
      if (fail.length === 0) {
        return `✓ 발송 완료 (${ok.length > 0 ? ok.join(", ") : "없음"})`
      }
      const failText = fail.map((r) => `${r.channel}(${r.status})`).join(", ")
      return `발송 완료: ✓ ${ok.length > 0 ? ok.join(", ") : "없음"} · ✗ ${failText}`
    }
    case "error":
      return `오류: ${ev.message}`
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + "…"
}

function progressTotals(events: GenerateProgressEvent[]): {
  total: number
  completed: number
} {
  let total = 0
  let completed = 0
  for (const ev of events) {
    if (ev.type === "start") total = ev.categories.length
    else if (ev.type === "category_done") completed += 1
  }
  return { total, completed }
}
